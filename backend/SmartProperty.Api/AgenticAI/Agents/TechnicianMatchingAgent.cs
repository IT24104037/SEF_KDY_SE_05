using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Tools;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.AgenticAI.Agents;

public class TechnicianMatchingAgent
{
    private readonly WorkerMatchingTool _workerTool;
    private readonly AppDbContext _context;

    public TechnicianMatchingAgent(
        WorkerMatchingTool workerTool,
        AppDbContext context)
    {
        _workerTool = workerTool;
        _context = context;
    }

    public async Task<Agent3Result> ExecuteAsync(Agent3Input input)
    {
        var workers = await _workerTool.GetVerifiedWorkersAsync();

        // ---------------------------------
        // STEP 1 - Correct skill/category
        // ---------------------------------
        var skilledWorkers = workers
            .Where(w => _workerTool.HasRequiredSkill(
                w,
                input.CategoryId,
                input.RequiredSkill))
            .ToList();

        // ---------------------------------
        // STEP 2 - Correct service area
        // ---------------------------------
        var areaMatchedWorkers = skilledWorkers
            .Where(w => _workerTool.IsInServiceArea(
                w,
                input.PropertyCity,
                input.PropertyPostalCode,
                input.PropertyLatitude,
                input.PropertyLongitude))
            .ToList();

        // =================================
        // EMERGENCY MATCHING
        // =================================
        if (input.IsEmergency)
        {
            var utcNow = DateTime.UtcNow;
            var localTime = DateTime.Now;

            var emergencyWorkers = areaMatchedWorkers
                .Where(w =>
                    _workerTool.IsAvailableAt(w, localTime) &&
                    _workerTool.IsFreeNow(w))
                .Select(w => new
                {
                    Worker = w,

                    Experience =
                        _workerTool.GetYearsOfExperience(
                            w,
                            input.CategoryId,
                            input.RequiredSkill)
                })
                .OrderByDescending(x => x.Experience ?? 0)
                .ToList();

            var selected = emergencyWorkers.FirstOrDefault();

            // No emergency worker available
            if (selected == null)
            {
                return await SaveResultAsync(
                    input,
                    new Agent3Result
                    {
                        MaintenanceRequestId =
                            input.MaintenanceRequestId,

                        Result =
                            "NO_AVAILABLE_EMERGENCY_WORKER",

                        WorkerId = null,

                        SuggestedDateTime = null,

                        ActiveJobCount = 0,

                        YearsOfExperience = null,

                        IsEmergency = true,

                        Reason =
                            "No verified worker with the required skill, service area, current availability and no active conflicting job was found."
                    });
            }

            // Emergency worker found
            return await SaveResultAsync(
                input,
                new Agent3Result
                {
                    MaintenanceRequestId =
                        input.MaintenanceRequestId,

                    Result = "MATCH_FOUND",

                    WorkerId =
                        selected.Worker.Id,

                    SuggestedDateTime =
                        utcNow,

                    ActiveJobCount =
                        _workerTool.GetActiveJobCount(
                            selected.Worker),

                    YearsOfExperience =
                        selected.Experience,

                    IsEmergency = true,

                    Reason =
                        "Verified emergency worker found with the required skill, correct service area, current availability and no active conflicting job."
                });
        }

        // =================================
        // NORMAL MAINTENANCE MATCHING
        // =================================

        var preferredTime =
            input.PreferredDateTime ?? DateTime.UtcNow;

        var normalWorkers = areaMatchedWorkers
            .Select(w => new
            {
                Worker = w,

                SuggestedTime =
                    _workerTool.GetNextAvailableTime(
                        w,
                        preferredTime),

                ActiveJobs =
                    _workerTool.GetActiveJobCount(w),

                Experience =
                    _workerTool.GetYearsOfExperience(
                        w,
                        input.CategoryId,
                        input.RequiredSkill)
            })
            .Where(x => x.SuggestedTime.HasValue)
            .OrderBy(x => x.ActiveJobs)
            .ThenBy(x => x.SuggestedTime)
            .ThenByDescending(x => x.Experience ?? 0)
            .ToList();

        var normalSelected =
            normalWorkers.FirstOrDefault();

        // No normal worker available
        if (normalSelected == null)
        {
            return await SaveResultAsync(
                input,
                new Agent3Result
                {
                    MaintenanceRequestId =
                        input.MaintenanceRequestId,

                    Result =
                        "NO_AVAILABLE_WORKER",

                    WorkerId = null,

                    SuggestedDateTime = null,

                    ActiveJobCount = 0,

                    YearsOfExperience = null,

                    IsEmergency = false,

                    Reason =
                        "No verified worker with the required skill and service area has a suitable available time."
                });
        }

        // Normal worker found
        return await SaveResultAsync(
            input,
            new Agent3Result
            {
                MaintenanceRequestId =
                    input.MaintenanceRequestId,

                Result = "MATCH_FOUND",

                WorkerId =
                    normalSelected.Worker.Id,

                SuggestedDateTime =
                    normalSelected.SuggestedTime,

                ActiveJobCount =
                    normalSelected.ActiveJobs,

                YearsOfExperience =
                    normalSelected.Experience,

                IsEmergency = false,

                Reason =
                    "Verified worker selected based on required skill, service area, next available time, workload and experience."
            });
    }

    private async Task<Agent3Result> SaveResultAsync(
        Agent3Input input,
        Agent3Result result)
    {
        var recommendation =
            new WorkerMatchRecommendation
            {
                MaintenanceRequestId =
                    input.MaintenanceRequestId,

                WorkerId =
                    result.WorkerId,

                Result =
                    result.Result,

                RequiredSkill =
                    input.RequiredSkill,

                CategoryId =
                    input.CategoryId,

                Priority =
                    input.Priority,

                Safety =
                    input.Safety,

                SuggestedDateTime =
                    result.SuggestedDateTime,

                ActiveJobCount =
                    result.ActiveJobCount,

                YearsOfExperience =
                    result.YearsOfExperience,

                Reason =
                    result.Reason,

                IsEmergency =
                    result.IsEmergency,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

        _context.WorkerMatchRecommendations
            .Add(recommendation);

        await _context.SaveChangesAsync();

        return result;
    }
}