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

        if (string.IsNullOrWhiteSpace(request.DocumentType) ||
            string.IsNullOrWhiteSpace(request.DocumentUrl))
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
            Longitude = request.Longitude,
            VerificationStatus = PropertyVerificationStatus.UnderReview,
            SubmittedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        _context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            Property = property,
            DocumentType = request.DocumentType.Trim(),
            DocumentUrl = request.DocumentUrl.Trim()
        });
        await _context.SaveChangesAsync();

        return MapProperty(property);
    }

    public async Task<List<PropertyResponseDto>> GetMyPropertiesAsync(
        int userId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return new List<PropertyResponseDto>();
        }

        var properties = await _context.Properties
            .Include(p => p.VerificationDocuments)
            .Where(p => p.PropertyOwnerId == owner.Id && !p.IsArchived)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return properties.Select(p => MapProperty(p)).ToList();
    }
    public async Task<List<PropertyResponseDto>> GetArchivedPropertiesAsync(
    int userId)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new List<PropertyResponseDto>();
    }

    return await _context.Properties
        .Where(p =>
            p.PropertyOwnerId == owner.Id &&
            p.IsArchived)
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
            IsArchived = p.IsArchived,
            VerificationStatus = p.VerificationStatus.ToString(),
            RejectionReason = p.RejectionReason,
            SubmittedAt = p.SubmittedAt,
            VerifiedAt = p.VerifiedAt
        })
        .ToListAsync();
}

    public async Task<PropertyResponseDto?> GetPropertyByIdAsync(
        int userId,
        int propertyId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return null;
        }

        var property = await _context.Properties
            .Include(p => p.VerificationDocuments)
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

        if (property.VerificationStatus != PropertyVerificationStatus.Approved)
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

    public async Task<PropertyResponseDto?> ResubmitRejectedPropertyAsync(
        int userId,
        int propertyId,
        ResubmitPropertyDto request)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return null;
        }

        // Load the property together with its current documents so we can
        // validate removed IDs and compute the post-operation document count
        // before committing anything.
        var property = await _context.Properties
            .Include(p => p.VerificationDocuments)
            .FirstOrDefaultAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                p.VerificationStatus == PropertyVerificationStatus.Rejected &&
                !p.IsArchived);

        if (property == null)
        {
            return null;
        }

        // Validate that every ID in RemovedDocumentIds belongs to THIS property.
        // Returning null here is treated as a 404/bad-request by the controller.
        if (request.RemovedDocumentIds.Count > 0)
        {
            var propertyDocIds = property.VerificationDocuments
                .Select(d => d.Id)
                .ToHashSet();

            foreach (var idToRemove in request.RemovedDocumentIds)
            {
                if (!propertyDocIds.Contains(idToRemove))
                {
                    // ID does not belong to this property — reject the whole request.
                    return null;
                }
            }
        }

        // Validate new documents: each entry must supply both fields.
        foreach (var newDoc in request.NewDocuments)
        {
            if (string.IsNullOrWhiteSpace(newDoc.DocumentType) ||
                string.IsNullOrWhiteSpace(newDoc.DocumentUrl))
            {
                return null;
            }
        }

        // Compute how many documents will remain after removes + adds.
        int survivingExisting = property.VerificationDocuments
            .Count(d => !request.RemovedDocumentIds.Contains(d.Id));
        int totalAfter = survivingExisting + request.NewDocuments.Count;

        if (totalAfter < 1)
        {
            // The owner must retain at least one verification document.
            return null;
        }

        // Execute the entire operation atomically.
        var isRelational = _context.Database.IsRelational();
        var transaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;
        try
        {
            // Remove documents the owner explicitly marked for removal.
            if (request.RemovedDocumentIds.Count > 0)
            {
                var docsToRemove = property.VerificationDocuments
                    .Where(d => request.RemovedDocumentIds.Contains(d.Id))
                    .ToList();

                _context.PropertyVerificationDocuments.RemoveRange(docsToRemove);
            }

            // Add new documents.
            foreach (var newDoc in request.NewDocuments)
            {
                _context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
                {
                    PropertyId = property.Id,
                    DocumentType = newDoc.DocumentType.Trim(),
                    DocumentUrl = newDoc.DocumentUrl.Trim()
                });
            }

            // Update property fields and reset verification status.
            property.Name = request.Name.Trim();
            property.Address = request.Address.Trim();
            property.City = request.City?.Trim();
            property.Description = request.Description?.Trim();
            property.Latitude = request.Latitude;
            property.Longitude = request.Longitude;
            property.VerificationStatus = PropertyVerificationStatus.UnderReview;
            property.RejectionReason = null;
            property.SubmittedAt = DateTime.UtcNow;
            property.VerifiedAt = null;
            property.VerifiedByAdminId = null;
            property.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync();
            }
            throw;
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }

        // Reload the updated property with its final documents for the response.
        await _context.Entry(property)
            .Collection(p => p.VerificationDocuments)
            .LoadAsync();

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
                p.VerificationStatus == PropertyVerificationStatus.Approved &&
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

    public async Task<bool> RestorePropertyAsync(
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
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            p.IsArchived);

    if (property == null)
    {
        return false;
    }

    property.IsArchived = false;
    property.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return true;
}

    public async Task<UnitOperationResult> CreateUnitAsync(
    int userId,
    int propertyId,
    CreateUnitDto request)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new UnitOperationResult
        {
            ErrorMessage = "Your account must be verified before managing units."
        };
    }

    var property = await _context.Properties
        .FirstOrDefaultAsync(p =>
            p.Id == propertyId &&
            p.PropertyOwnerId == owner.Id &&
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            !p.IsArchived);

    if (property == null)
    {
        return new UnitOperationResult
        {
            ErrorMessage = "Property not found."
        };
    }

    var unitLabel = request.UnitLabel.Trim();

    var duplicate = await _context.Units
        .AnyAsync(u =>
            u.PropertyId == propertyId &&
            u.UnitLabel == unitLabel &&
            !u.IsArchived &&
            !u.IsDeleted);

    if (duplicate)
    {
        return new UnitOperationResult
        {
            ErrorMessage =
                "A unit with this label already exists in this property."
        };
    }

    var unit = new Unit
    {
        PropertyId = propertyId,
        UnitLabel = unitLabel,
        Description = request.Description?.Trim()
    };

    _context.Units.Add(unit);
    await _context.SaveChangesAsync();

    return new UnitOperationResult
    {
        Unit = MapUnit(unit)
    };
}
    

    public async Task<List<UnitResponseDto>> GetUnitsAsync(
        int userId,
        int propertyId)
    {
        var owner = await _context.PropertyOwners
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null ||
            owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return new List<UnitResponseDto>();
        }

        var propertyExists = await _context.Properties
            .AnyAsync(p =>
                p.Id == propertyId &&
                p.PropertyOwnerId == owner.Id &&
                p.VerificationStatus == PropertyVerificationStatus.Approved &&
                !p.IsArchived);

        if (!propertyExists)
        {
            return new List<UnitResponseDto>();
        }

        return await _context.Units
            .Where(u => u.PropertyId == propertyId && !u.IsArchived && !u.IsDeleted)
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
                !u.IsDeleted &&
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
            u.Property.VerificationStatus == PropertyVerificationStatus.Approved &&
            !u.IsArchived &&
            !u.IsDeleted &&
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
            !u.IsArchived &&
            !u.IsDeleted);

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
            u.Property.VerificationStatus == PropertyVerificationStatus.Approved &&
            !u.IsArchived &&
            !u.IsDeleted &&
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
public async Task<List<UnitResponseDto>> GetArchivedUnitsAsync(
    int userId,
    int propertyId)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new List<UnitResponseDto>();
    }

    var propertyExists = await _context.Properties
        .AnyAsync(p =>
            p.Id == propertyId &&
            p.PropertyOwnerId == owner.Id &&
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            !p.IsArchived);

    if (!propertyExists)
    {
        return new List<UnitResponseDto>();
    }

    return await _context.Units
        .Where(u =>
            u.PropertyId == propertyId &&
            u.IsArchived &&
            !u.IsDeleted)
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

public async Task<RestoreUnitOperationResult> RestoreUnitAsync(
    int userId,
    int propertyId,
    int unitId)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new RestoreUnitOperationResult
        {
            Success = false,
            ErrorMessage = "Property owner is not verified."
        };
    }

    var unit = await _context.Units
        .Include(u => u.Property)
        .FirstOrDefaultAsync(u =>
            u.Id == unitId &&
            u.PropertyId == propertyId &&
            u.Property!.PropertyOwnerId == owner.Id &&
            u.Property.VerificationStatus == PropertyVerificationStatus.Approved &&
            u.IsArchived &&
            !u.IsDeleted &&
            !u.Property.IsArchived);

    if (unit == null)
    {
        return new RestoreUnitOperationResult
        {
            Success = false,
            ErrorMessage = "Archived unit was not found."
        };
    }

    var duplicateActiveUnit = await _context.Units
        .AnyAsync(u =>
            u.PropertyId == propertyId &&
            u.Id != unitId &&
            u.UnitLabel == unit.UnitLabel &&
            !u.IsArchived &&
            !u.IsDeleted);

    if (duplicateActiveUnit)
    {
        return new RestoreUnitOperationResult
        {
            Success = false,
            DuplicateLabel = true,
            ErrorMessage =
                $"Cannot restore unit '{unit.UnitLabel}' because an active unit with the same label already exists."
        };
    }

    unit.IsArchived = false;
    unit.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return new RestoreUnitOperationResult
    {
        Success = true
    };
}

public async Task<bool> SoftDeleteUnitAsync(
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
            u.Property.VerificationStatus == PropertyVerificationStatus.Approved &&
            u.IsArchived &&
            !u.IsDeleted &&
            !u.Property.IsArchived);

    if (unit == null)
    {
        return false;
    }

    unit.IsDeleted = true;
    unit.DeletedAt = DateTime.UtcNow;
    unit.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return true;
}

public async Task<BulkUnitOperationResult> CreateBulkUnitsAsync(
    int userId,
    int propertyId,
    CreateBulkUnitsDto request)
{
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(po => po.UserId == userId);

    if (owner == null ||
        owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return new BulkUnitOperationResult
        {
            ErrorMessage =
                "Your account must be verified before managing units."
        };
    }

    var property = await _context.Properties
        .FirstOrDefaultAsync(p =>
            p.Id == propertyId &&
            p.PropertyOwnerId == owner.Id &&
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            !p.IsArchived);

    if (property == null)
    {
        return new BulkUnitOperationResult
        {
            ErrorMessage = "Property not found."
        };
    }

    var requestedLabels = request.Units
        .Select(u => u.UnitLabel.Trim())
        .ToList();

    // Prevent duplicate labels inside the same request.
    if (requestedLabels.Count != requestedLabels.Distinct().Count())
    {
        return new BulkUnitOperationResult
        {
            ErrorMessage =
                "Duplicate unit labels were provided in the request."
        };
    }

    // Prevent labels that already exist for this property.
    var existingLabels = await _context.Units
        .Where(u =>
            u.PropertyId == propertyId &&
            requestedLabels.Contains(u.UnitLabel) &&
            !u.IsArchived &&
            !u.IsDeleted)
        .Select(u => u.UnitLabel)
        .ToListAsync();

    if (existingLabels.Any())
    {
        return new BulkUnitOperationResult
        {
            ErrorMessage =
                "One or more unit labels already exist in this property."
        };
    }

    var units = request.Units
        .Select(u => new Unit
        {
            PropertyId = propertyId,
            UnitLabel = u.UnitLabel.Trim(),
            Description = u.Description?.Trim()
        })
        .ToList();

    _context.Units.AddRange(units);

    await _context.SaveChangesAsync();

    return new BulkUnitOperationResult
    {
        Units = units
            .Select(MapUnit)
            .ToList()
    };
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

    if (owner.VerificationStatus != OwnerVerificationStatus.Verified)
    {
        return null;
    }

    var totalProperties = await _context.Properties
        .CountAsync(p => p.PropertyOwnerId == owner.Id);

    var activeProperties = await _context.Properties
        .CountAsync(p =>
            p.PropertyOwnerId == owner.Id &&
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            !p.IsArchived);

    var archivedProperties = await _context.Properties
        .CountAsync(p =>
            p.PropertyOwnerId == owner.Id &&
            p.IsArchived);

    var propertyIds = await _context.Properties
        .Where(p => p.PropertyOwnerId == owner.Id &&
            p.VerificationStatus == PropertyVerificationStatus.Approved &&
            !p.IsArchived)
        .Select(p => p.Id)
        .ToListAsync();

    var totalUnits = await _context.Units
        .CountAsync(u =>
            propertyIds.Contains(u.PropertyId) &&
            !u.IsDeleted);

    var activeUnits = await _context.Units
        .CountAsync(u =>
            propertyIds.Contains(u.PropertyId) &&
            !u.IsArchived &&
            !u.IsDeleted);

    var archivedUnits = await _context.Units
        .CountAsync(u =>
            propertyIds.Contains(u.PropertyId) &&
            u.IsArchived &&
            !u.IsDeleted);

    var occupiedUnitIds = await _context.Tenancies
        .Where(t =>
            t.Status == Entities.Tenancy.TenancyStatus.Active &&
            _context.Units.Any(u =>
                u.Id == t.UnitId &&
                propertyIds.Contains(u.PropertyId) &&
                !u.IsArchived &&
                !u.IsDeleted))
        .Select(t => t.UnitId)
        .Distinct()
        .ToListAsync();

    var occupiedUnits = await _context.Units
        .CountAsync(u =>
            occupiedUnitIds.Contains(u.Id) &&
            propertyIds.Contains(u.PropertyId) &&
            !u.IsArchived &&
            !u.IsDeleted);

    var vacantUnits = activeUnits - occupiedUnits;

    return new OwnerDashboardDto
    {
        TotalProperties = totalProperties,
        ActiveProperties = activeProperties,
        ArchivedProperties = archivedProperties,
        TotalUnits = totalUnits,
        ActiveUnits = activeUnits,
        ArchivedUnits = archivedUnits,
        OccupiedUnits = occupiedUnits,
        VacantUnits = vacantUnits
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
            IsArchived = property.IsArchived,
            VerificationStatus = property.VerificationStatus.ToString(),
            RejectionReason = property.RejectionReason,
            SubmittedAt = property.SubmittedAt,
            VerifiedAt = property.VerifiedAt,
            Documents = (property.VerificationDocuments ?? new List<PropertyVerificationDocument>())
                .Select(d => new PropertyVerificationDocumentDto
                {
                    Id = d.Id,
                    DocumentType = d.DocumentType,
                    DocumentUrl = d.DocumentUrl
                })
                .ToList()
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
