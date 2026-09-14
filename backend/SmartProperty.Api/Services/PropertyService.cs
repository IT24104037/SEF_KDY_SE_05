using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class PropertyService : IPropertyService
{
    private readonly AppDbContext _context;

    public PropertyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PropertyResponseDto?> CreatePropertyAsync(
        int userId,
        CreatePropertyDto request)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return null;
        }

        var property = new Property
        {
            PropertyOwnerId = owner.Id,
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City?.Trim(),
            Description = request.Description?.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        return MapProperty(property);
    }

    public async Task<List<PropertyResponseDto>> GetMyPropertiesAsync(
        int userId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return new List<PropertyResponseDto>();
        }

        return await _context.Properties
            .Where(p => p.PropertyOwnerId == owner.Id && !p.IsArchived)
            .OrderBy(p => p.Name)
            .Select(p => new PropertyResponseDto
            {
                Id = p.Id,
                PropertyOwnerId = p.PropertyOwnerId,
                Name = p.Name,
                Address = p.Address,
                City = p.City,
                Description = p.Description,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                IsArchived = p.IsArchived
            })
            .ToListAsync();
    }

    public async Task<PropertyResponseDto?> GetPropertyByIdAsync(
        int userId,
        int propertyId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return null;
        }

        var property = await _context.Properties
            .FirstOrDefaultAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                !p.IsArchived);

        return property == null ? null : MapProperty(property);
    }

    public async Task<PropertyResponseDto?> UpdatePropertyAsync(
        int userId,
        int propertyId,
        UpdatePropertyDto request)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return null;
        }

        var property = await _context.Properties
            .FirstOrDefaultAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                !p.IsArchived);

        if (property == null)
        {
            return null;
        }

        property.Name = request.Name.Trim();
        property.Address = request.Address.Trim();
        property.City = request.City?.Trim();
        property.Description = request.Description?.Trim();
        property.Latitude = request.Latitude;
        property.Longitude = request.Longitude;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapProperty(property);
    }

    public async Task<bool> ArchivePropertyAsync(
        int userId,
        int propertyId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return false;
        }

        var property = await _context.Properties
            .FirstOrDefaultAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                !p.IsArchived);

        if (property == null)
        {
            return false;
        }

        property.IsArchived = true;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<UnitResponseDto?> CreateUnitAsync(
        int userId,
        int propertyId,
        CreateUnitDto request)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return null;
        }

        var property = await _context.Properties
            .FirstOrDefaultAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                !p.IsArchived);

        if (property == null)
        {
            return null;
        }

        var unitLabel = request.UnitLabel.Trim();

        var duplicate = await _context.Units
            .AnyAsync(u =>
                u.PropertyId == propertyId &&
                u.UnitLabel == unitLabel &&
                !u.IsArchived);

        if (duplicate)
        {
            return null;
        }

        var unit = new Unit
        {
            PropertyId = propertyId,
            UnitLabel = unitLabel,
            Description = request.Description?.Trim()
        };

        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        return MapUnit(unit);
    }

    public async Task<List<UnitResponseDto>> GetUnitsAsync(
        int userId,
        int propertyId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return new List<UnitResponseDto>();
        }

        var propertyExists = await _context.Properties
            .AnyAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                !p.IsArchived);

        if (!propertyExists)
        {
            return new List<UnitResponseDto>();
        }

        return await _context.Units
            .Where(u => u.PropertyId == propertyId && !u.IsArchived)
            .OrderBy(u => u.UnitLabel)
            .Select(u => new UnitResponseDto
            {
                Id = u.Id,
                PropertyId = u.PropertyId,
                UnitLabel = u.UnitLabel,
                Description = u.Description,
                IsArchived = u.IsArchived,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<UnitResponseDto?> GetUnitByIdAsync(
        int userId,
        int propertyId,
        int unitId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return null;
        }

        var unit = await _context.Units
            .Include(u => u.Property)
            .FirstOrDefaultAsync(u =>
                u.Id == unitId &&
                u.PropertyId == propertyId &&
                u.Property!.PropertyOwnerId == owner.Id &&
                !u.IsArchived &&
                !u.Property.IsArchived);

        return unit == null ? null : MapUnit(unit);
    }
    public async Task<UnitResponseDto?> UpdateUnitAsync(
    int userId,
    int propertyId,
    int unitId,
    UpdateUnitDto request)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return null;
    }

    var unit = await _context.Units
        .Include(u => u.Property)
        .FirstOrDefaultAsync(u =>
            u.Id == unitId &&
            u.PropertyId == propertyId &&
            u.Property!.PropertyOwnerId == owner.Id &&
            !u.IsArchived &&
            !u.Property.IsArchived);

    if (unit == null)
    {
        return null;
    }

    var unitLabel = request.UnitLabel.Trim();

    var duplicate = await _context.Units
        .AnyAsync(u =>
            u.PropertyId == propertyId &&
            u.Id != unitId &&
            u.UnitLabel == unitLabel &&
            !u.IsArchived);

    if (duplicate)
    {
        return null;
    }

    unit.UnitLabel = unitLabel;
    unit.Description = request.Description?.Trim();
    unit.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return MapUnit(unit);
}

public async Task<bool> ArchiveUnitAsync(
    int userId,
    int propertyId,
    int unitId)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return false;
    }

    var unit = await _context.Units
        .Include(u => u.Property)
        .FirstOrDefaultAsync(u =>
            u.Id == unitId &&
            u.PropertyId == propertyId &&
            u.Property!.PropertyOwnerId == owner.Id &&
            !u.IsArchived &&
            !u.Property.IsArchived);

    if (unit == null)
    {
        return false;
    }

    unit.IsArchived = true;
    unit.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return true;
}
public async Task<List<UnitResponseDto>> CreateBulkUnitsAsync(
    int userId,
    int propertyId,
    CreateBulkUnitsDto request)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new List<UnitResponseDto>();
    }

    var property = await _context.Properties
        .FirstOrDefaultAsync(p =>
            p.Id == propertyId &&
            p.PropertyOwnerId == owner.Id &&
            !p.IsArchived);

    if (property == null)
    {
        return new List<UnitResponseDto>();
    }

    var requestedLabels = request.Units
        .Select(u => u.UnitLabel.Trim())
        .ToList();

    // Prevent duplicate labels inside the same request.
    if (requestedLabels.Count != requestedLabels.Distinct().Count())
    {
        return new List<UnitResponseDto>();
    }

    // Prevent labels that already exist for this property.
    var existingLabels = await _context.Units
        .Where(u =>
            u.PropertyId == propertyId &&
            requestedLabels.Contains(u.UnitLabel))
        .Select(u => u.UnitLabel)
        .ToListAsync();

    if (existingLabels.Any())
    {
        return new List<UnitResponseDto>();
    }

    var units = request.Units.Select(u => new Unit
    {
        PropertyId = propertyId,
        UnitLabel = u.UnitLabel.Trim(),
        Description = u.Description?.Trim()
    }).ToList();

    _context.Units.AddRange(units);

    await _context.SaveChangesAsync();

    return units
        .Select(MapUnit)
        .ToList();
}

public async Task<OwnerDashboardDto?> GetOwnerDashboardAsync(
    int userId)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null)
    {
        return null;
    }

    var totalProperties = await _context.Properties
        .CountAsync(p => p.PropertyOwnerId == owner.Id);

    var activeProperties = await _context.Properties
        .CountAsync(p =>
            p.PropertyOwnerId == owner.Id &&
            !p.IsArchived);

    var archivedProperties = await _context.Properties
        .CountAsync(p =>
            p.PropertyOwnerId == owner.Id &&
            p.IsArchived);

    var propertyIds = await _context.Properties
        .Where(p => p.PropertyOwnerId == owner.Id)
        .Select(p => p.Id)
        .ToListAsync();

    var totalUnits = await _context.Units
        .CountAsync(u => propertyIds.Contains(u.PropertyId));

    var activeUnits = await _context.Units
        .CountAsync(u =>
            propertyIds.Contains(u.PropertyId) &&
            !u.IsArchived);

    var archivedUnits = await _context.Units
        .CountAsync(u =>
            propertyIds.Contains(u.PropertyId) &&
            u.IsArchived);

    return new OwnerDashboardDto
    {
        TotalProperties = totalProperties,
        ActiveProperties = activeProperties,
        ArchivedProperties = archivedProperties,
        TotalUnits = totalUnits,
        ActiveUnits = activeUnits,
        ArchivedUnits = archivedUnits
    };
}
    private static PropertyResponseDto MapProperty(Property property)
    {
        return new PropertyResponseDto
        {
            Id = property.Id,
            PropertyOwnerId = property.PropertyOwnerId,
            Name = property.Name,
            Address = property.Address,
            City = property.City,
            Description = property.Description,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            CreatedAt = property.CreatedAt,
            UpdatedAt = property.UpdatedAt,
            IsArchived = property.IsArchived
        };
    }

    private static UnitResponseDto MapUnit(Unit unit)
    {
        return new UnitResponseDto
        {
            Id = unit.Id,
            PropertyId = unit.PropertyId,
            UnitLabel = unit.UnitLabel,
            Description = unit.Description,
            IsArchived = unit.IsArchived,
            CreatedAt = unit.CreatedAt,
            UpdatedAt = unit.UpdatedAt
        };
    }
}