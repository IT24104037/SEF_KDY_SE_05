using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Worker;
using WorkerEntity = SmartProperty.Api.Entities.Worker.Worker;

namespace SmartProperty.Api.AgenticAI.Tools;

public class WorkerMatchingTool
{
    private readonly AppDbContext _context;

    public WorkerMatchingTool(AppDbContext context)
    {
        _context = context;
    }

    // 1. Get only verified and globally available workers
    public async Task<List<WorkerEntity>> GetVerifiedWorkersAsync()
    {
        return await _context.Workers
            .AsNoTracking()
            .Where(w =>
                w.VerificationStatus == WorkerVerificationStatus.Verified &&
                w.IsAvailable)
            .Include(w => w.Skills)
            .Include(w => w.Availabilities)
            .Include(w => w.ServiceAreas)
            .Include(w => w.WorkOrders)
            .ToListAsync();
    }

    // 2. Check whether worker has the required skill/category
    public bool HasRequiredSkill(
        WorkerEntity worker,
        int? categoryId,
        string? requiredSkill)
    {
        if (categoryId.HasValue)
        {
            if (worker.Skills.Any(s => s.CategoryId == categoryId.Value))
                return true;
        }

        if (!string.IsNullOrWhiteSpace(requiredSkill))
        {
            return worker.Skills.Any(s =>
                string.Equals(
                    s.SkillName,
                    requiredSkill,
                    StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    // 3. Check availability for a particular date/time
    public bool IsAvailableAt(
        WorkerEntity worker,
        DateTime dateTime)
    {
        if (!worker.IsAvailable)
            return false;

        return worker.Availabilities.Any(a =>
            a.IsActive &&
            a.DayOfWeek == dateTime.DayOfWeek &&
            dateTime.TimeOfDay >= a.StartTime &&
            dateTime.TimeOfDay <= a.EndTime);
    }

    // 4. Count active jobs
    public int GetActiveJobCount(WorkerEntity worker)
    {
        return worker.WorkOrders.Count(w =>
            w.Status == WorkOrderStatus.Assigned ||
            w.Status == WorkOrderStatus.InProgress);
    }

    // 5. Emergency worker must have no active job
    public bool IsFreeNow(WorkerEntity worker)
    {
        return GetActiveJobCount(worker) == 0;
    }

    // 6. Get experience for the matching skill/category
    public int? GetYearsOfExperience(
        WorkerEntity worker,
        int? categoryId,
        string? requiredSkill)
    {
        var matchingSkill = worker.Skills.FirstOrDefault(s =>
            (categoryId.HasValue &&
             s.CategoryId == categoryId.Value) ||

            (!string.IsNullOrWhiteSpace(requiredSkill) &&
             string.Equals(
                 s.SkillName,
                 requiredSkill,
                 StringComparison.OrdinalIgnoreCase)));

        return matchingSkill?.YearsOfExperience;
    }

    // 7. Check whether property is inside worker service area
    public bool IsInServiceArea(
        WorkerEntity worker,
        string? propertyCity,
        string? propertyPostalCode,
        double? propertyLatitude,
        double? propertyLongitude)
    {
        foreach (var area in worker.ServiceAreas)
        {
            // Prefer latitude/longitude when both are available
            if (propertyLatitude.HasValue &&
                propertyLongitude.HasValue &&
                area.Latitude.HasValue &&
                area.Longitude.HasValue)
            {
                var distance = CalculateDistanceKm(
                    propertyLatitude.Value,
                    propertyLongitude.Value,
                    area.Latitude.Value,
                    area.Longitude.Value);

                if (distance <= area.RadiusKm)
                    return true;
            }

            // Fallback to postal code
            if (!string.IsNullOrWhiteSpace(propertyPostalCode) &&
                !string.IsNullOrWhiteSpace(area.PostalCode) &&
                string.Equals(
                    propertyPostalCode.Trim(),
                    area.PostalCode.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Fallback to city
            if (!string.IsNullOrWhiteSpace(propertyCity) &&
                !string.IsNullOrWhiteSpace(area.City) &&
                string.Equals(
                    propertyCity.Trim(),
                    area.City.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    // Haversine distance calculation
    private static double CalculateDistanceKm(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2)
    {
        const double earthRadiusKm = 6371.0;

        var lat1 = DegreesToRadians(latitude1);
        var lat2 = DegreesToRadians(latitude2);

        var deltaLat =
            DegreesToRadians(latitude2 - latitude1);

        var deltaLon =
            DegreesToRadians(longitude2 - longitude1);

        var a =
            Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
            Math.Cos(lat1) *
            Math.Cos(lat2) *
            Math.Sin(deltaLon / 2) *
            Math.Sin(deltaLon / 2);

        var c =
            2 * Math.Atan2(
                Math.Sqrt(a),
                Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }


    public DateTime? GetNextAvailableTime(
    WorkerEntity worker,
    DateTime fromDateTime,
    int daysToSearch = 7)
{
    if (!worker.IsAvailable)
        return null;

    for (var dayOffset = 0; dayOffset <= daysToSearch; dayOffset++)
    {
        var date = fromDateTime.Date.AddDays(dayOffset);

        var slots = worker.Availabilities
            .Where(a =>
                a.IsActive &&
                a.DayOfWeek == date.DayOfWeek)
            .OrderBy(a => a.StartTime)
            .ToList();

        foreach (var slot in slots)
        {
            var slotStart = date.Add(slot.StartTime);
            var slotEnd = date.Add(slot.EndTime);

            // If checking today and we are already inside the slot,
            // current time can be used.
            if (dayOffset == 0 &&
                fromDateTime >= slotStart &&
                fromDateTime <= slotEnd)
            {
                return fromDateTime;
            }

            // Otherwise use the next slot start.
            if (slotStart >= fromDateTime)
            {
                return slotStart;
            }
        }
    }

    return null;
}

}