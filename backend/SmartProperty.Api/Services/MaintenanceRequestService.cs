using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Interfaces;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Services;

public class MaintenanceRequestService : IMaintenanceRequestService
{
    private readonly AppDbContext _context;

    public MaintenanceRequestService(AppDbContext context)
    {
        _context = context;
    }

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------

    public async Task<MaintenanceRequestDto> CreateAsync(
    int currentUserId,
    CreateMaintenanceRequestDto dto)
{
    if (dto == null)
    {
        throw new ArgumentNullException(nameof(dto));
    }

    if (string.IsNullOrWhiteSpace(dto.Description))
    {
        throw new InvalidOperationException(
            "Description is required.");
    }

    if (string.IsNullOrWhiteSpace(dto.RequestType))
    {
        throw new InvalidOperationException(
            "Request type is required.");
    }

    // Find tenant profile linked to logged-in user.
    var tenant = await _context.Tenants
        .FirstOrDefaultAsync(x =>
            x.UserId == currentUserId);

    if (tenant == null)
    {
        throw new InvalidOperationException(
            "Tenant profile was not found.");
    }

    if (!tenant.IsActive)
    {
        throw new InvalidOperationException(
            "An active tenant account is required.");
    }

    // Find active tenancy.
    var activeTenancy = await _context.Tenancies
        .AsNoTracking()
        .FirstOrDefaultAsync(x =>
            x.TenantId == tenant.Id &&
            x.Status == TenancyStatus.Active &&
            x.EndDate == null);

    if (activeTenancy == null)
    {
        throw new InvalidOperationException(
            "No active tenancy was found for this tenant.");
    }

    // Find unit connected to active tenancy.
    var unit = await _context.Units
        .AsNoTracking()
        .FirstOrDefaultAsync(x =>
            x.Id == activeTenancy.UnitId &&
            !x.IsArchived &&
            !x.IsDeleted);

    if (unit == null)
    {
        throw new InvalidOperationException(
            "The unit linked to the active tenancy was not found or is unavailable.");
    }

    var requestType =
        dto.RequestType.Trim().ToUpperInvariant();

    if (requestType != "NORMAL" &&
        requestType != "EMERGENCY")
    {
        throw new InvalidOperationException(
            "Request type must be NORMAL or EMERGENCY.");
    }

    // Normal maintenance requires an image.
    if (requestType == "NORMAL" &&
        string.IsNullOrWhiteSpace(dto.ImageUrl))
    {
        throw new InvalidOperationException(
            "A photo is required for a normal maintenance request.");
    }

    // Emergency request requires emergency type.
    if (requestType == "EMERGENCY" &&
        string.IsNullOrWhiteSpace(dto.EmergencyType))
    {
        throw new InvalidOperationException(
            "Emergency type is required.");
    }

    await using var transaction =
        await _context.Database.BeginTransactionAsync();

    try
    {
        var now = DateTime.UtcNow;

        var request = new MaintenanceRequest
        {
            TenantId = tenant.Id,

            TenancyId = activeTenancy.Id,

            UnitId = unit.Id,
            PropertyId = unit.PropertyId,

            Description = dto.Description.Trim(),

            RequestType = requestType,

            EmergencyType =
                requestType == "EMERGENCY"
                    ? dto.EmergencyType?.Trim()
                    : null,

            Status =
                requestType == "EMERGENCY"
                    ? "Emergency"
                    : "Submitted",

            Priority =
                requestType == "EMERGENCY"
                    ? "Critical"
                    : null,

            CreatedAt = now,
            UpdatedAt = now
        };

        _context.MaintenanceRequests.Add(request);

        // Save first so PostgreSQL generates request.Id.
        await _context.SaveChangesAsync();

        // Save image metadata in MaintenanceImages.
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            var maintenanceImage =
                new MaintenanceImage
                {
                    MaintenanceRequestId = request.Id,
                    ImageUrl = dto.ImageUrl.Trim(),
                    CreatedAt = now
                };

            _context.MaintenanceImages.Add(
                maintenanceImage);
        }

        // Save initial status history.
        var history =
            new MaintenanceStatusHistory
            {
                MaintenanceRequestId = request.Id,
                OldStatus = string.Empty,
                NewStatus = request.Status,
                ChangedByUserId = currentUserId,
                Note = "Maintenance request created.",
                ChangedAt = now
            };

        _context.MaintenanceStatusHistories.Add(
            history);

        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return await BuildDtoAsync(request);
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

    // ---------------------------------------------------------
    // GET ALL
    // ---------------------------------------------------------

    public async Task<PagedMaintenanceRequestsDto> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        string? search,
        string? status,
        string? requestType,
        string? priority,
        int? propertyId,
        string sortBy,
        string sortDirection,
        int page,
        int pageSize)
    {
        if (page < 1)
            page = 1;

        if (pageSize < 1 || pageSize > 100)
            pageSize = 10;

        var query = _context.MaintenanceRequests
            .Include(x => x.Category)
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .AsNoTracking()
            .AsQueryable();

        // TENANT → only own requests
        if (currentUserRole == "Tenant")
        {
            var tenant = await _context.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == currentUserId);

            if (tenant == null)
                return EmptyResult(page, pageSize);

            query = query.Where(
                x => x.TenantId == tenant.Id);
        }

        // OWNER → only requests from own properties
        else if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == currentUserId);

            if (owner == null)
                return EmptyResult(page, pageSize);

            query = query.Where(
                x => x.Property.PropertyOwnerId == owner.Id);
        }

        // ADMIN → all requests
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to view maintenance requests.");
        }

        // SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            var value = $"%{search.Trim()}%";

            query = query.Where(x =>
                EF.Functions.ILike(
                    x.Description,
                    value) ||

                (x.EmergencyType != null &&
                 EF.Functions.ILike(
                     x.EmergencyType,
                     value)) ||

                (x.Category != null &&
                 EF.Functions.ILike(
                     x.Category.Name,
                     value)));
        }

        // FILTER STATUS
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(
                x => x.Status == status);
        }

        // FILTER TYPE
        if (!string.IsNullOrWhiteSpace(requestType))
        {
            var type = requestType.Trim().ToUpperInvariant();

            query = query.Where(
                x => x.RequestType == type);
        }

        // FILTER PRIORITY
        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(
                x => x.Priority == priority);
        }

        // FILTER PROPERTY
        if (propertyId.HasValue)
        {
            query = query.Where(
                x => x.PropertyId == propertyId.Value);
        }

        var totalCount = await query.CountAsync();

        var ascending =
            sortDirection.Equals(
                "asc",
                StringComparison.OrdinalIgnoreCase);

        query = sortBy.ToLowerInvariant() switch
        {
            "status" => ascending
                ? query.OrderBy(x => x.Status)
                : query.OrderByDescending(x => x.Status),

            "priority" => ascending
                ? query.OrderBy(x => x.Priority)
                : query.OrderByDescending(x => x.Priority),

            "updatedat" => ascending
                ? query.OrderBy(x => x.UpdatedAt)
                : query.OrderByDescending(x => x.UpdatedAt),

            _ => ascending
                ? query.OrderBy(x => x.CreatedAt)
                : query.OrderByDescending(x => x.CreatedAt)
        };

        var requests = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new List<MaintenanceRequestDto>();

        foreach (var request in requests)
        {
            result.Add(
                await BuildDtoAsync(request));
        }

        return new PagedMaintenanceRequestsDto
        {
            Requests = result,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize)
        };
    }

    // ---------------------------------------------------------
    // GET ONE
    // ---------------------------------------------------------

    public async Task<MaintenanceRequestDto?> GetByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole)
    {
        var request = await _context.MaintenanceRequests
            .Include(x => x.Category)
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request == null)
            return null;

        if (!await CanAccessAsync(
                request,
                currentUserId,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You cannot access this maintenance request.");
        }

        return await BuildDtoAsync(request);
    }

    // ---------------------------------------------------------
    // UPDATE DESCRIPTION
    // ---------------------------------------------------------

    public async Task<MaintenanceRequestDto?> UpdateAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        UpdateMaintenanceRequestDto dto)
    {
       var request = await _context.MaintenanceRequests
            .Include(x => x.Category)
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request == null)
            return null;

        if (currentUserRole != "Tenant")
        {
            throw new UnauthorizedAccessException(
                "Only the tenant can edit the request description.");
        }

        if (!await CanAccessAsync(
                request,
                currentUserId,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You cannot edit this maintenance request.");
        }

        // Tenant can edit only before processing has progressed.
        var editableStatuses = new[]
        {
            "Submitted",
            "NeedsMoreInfo",
            "Emergency"
        };

        if (!editableStatuses.Contains(request.Status))
        {
            throw new InvalidOperationException(
                "This maintenance request can no longer be edited.");
        }

        request.Description = dto.Description.Trim();

        if (request.RequestType == "EMERGENCY")
        {
            request.EmergencyType =
                dto.EmergencyType?.Trim();
        }

        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(request);
    }

    // ---------------------------------------------------------
    // STATUS CHANGE
    // ---------------------------------------------------------

    public async Task<MaintenanceRequestDto?> UpdateStatusAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        UpdateMaintenanceStatusDto dto)
    {
        var request = await _context.MaintenanceRequests
            .Include(x => x.Category)
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request == null)
            return null;

        if (!await CanAccessAsync(
                request,
                currentUserId,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You cannot update this maintenance request.");
        }

        var newStatus = dto.Status.Trim();

        // Tenant can only cancel its own request.
        if (currentUserRole == "Tenant")
        {
            if (newStatus != "Cancelled")
            {
                throw new UnauthorizedAccessException(
                    "A tenant can only cancel a maintenance request.");
            }

            var cancellable = new[]
            {
                "Submitted",
                "NeedsMoreInfo",
                "Emergency"
            };

            if (!cancellable.Contains(request.Status))
            {
                throw new InvalidOperationException(
                    "This request can no longer be cancelled.");
            }
        }
        else if (currentUserRole != "Admin" &&
                 currentUserRole != "PropertyOwner")
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to change the request status.");
        }

        if (!IsValidTransition(
                request.Status,
                newStatus))
        {
            throw new InvalidOperationException(
                $"Invalid status transition from " +
                $"{request.Status} to {newStatus}.");
        }

        var oldStatus = request.Status;

        request.Status = newStatus;
        request.UpdatedAt = DateTime.UtcNow;

        var history = new MaintenanceStatusHistory
        {
            MaintenanceRequestId = request.Id,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ChangedByUserId = currentUserId,
            Note = dto.Note?.Trim(),
            ChangedAt = DateTime.UtcNow
        };

        _context.MaintenanceStatusHistories.Add(history);

        await _context.SaveChangesAsync();

        return await BuildDtoAsync(request);
    }

    // ---------------------------------------------------------
    // HISTORY
    // ---------------------------------------------------------

    public async Task<List<MaintenanceStatusHistoryDto>?> GetHistoryAsync(
        int id,
        int currentUserId,
        string currentUserRole)
    {
        var request = await _context.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request == null)
            return null;

        if (!await CanAccessAsync(
                request,
                currentUserId,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You cannot view this maintenance request history.");
        }

        return await _context.MaintenanceStatusHistories
            .AsNoTracking()
            .Where(x =>
                x.MaintenanceRequestId == id)
            .OrderBy(x => x.ChangedAt)
            .Select(x =>
                new MaintenanceStatusHistoryDto
                {
                    Id = x.Id,
                    OldStatus = x.OldStatus,
                    NewStatus = x.NewStatus,
                    ChangedByUserId =
                        x.ChangedByUserId,
                    Note = x.Note,
                    ChangedAt = x.ChangedAt
                })
            .ToListAsync();
    }

    // ---------------------------------------------------------
    // ACCESS CONTROL
    // ---------------------------------------------------------

    private async Task<bool> CanAccessAsync(
        MaintenanceRequest request,
        int currentUserId,
        string currentUserRole)
    {
        if (currentUserRole == "Admin")
            return true;

        if (currentUserRole == "Tenant")
        {
            return await _context.Tenants
                .AnyAsync(x =>
                    x.Id == request.TenantId &&
                    x.UserId == currentUserId);
        }

       if (currentUserRole == "PropertyOwner")
{
    var owner = await _context.PropertyOwners
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.UserId == currentUserId);

    if (owner == null)
        return false;

    return await _context.Properties
        .AnyAsync(x =>
            x.Id == request.PropertyId &&
            x.PropertyOwnerId == owner.Id);
}

        return false;
    }

    // ---------------------------------------------------------
    // STATUS WORKFLOW
    // ---------------------------------------------------------

    private static bool IsValidTransition(
        string oldStatus,
        string newStatus)
    {
        var transitions =
            new Dictionary<string, string[]>
            {
                ["Submitted"] = new[]
                {
                    "Analysing",
                    "NeedsMoreInfo",
                    "Cancelled"
                },

                ["Emergency"] = new[]
                {
                    "Analysing",
                    "OwnerArrangingExternalEmergencyService",
                    "Cancelled"
                },

                ["Analysing"] = new[]
                {
                    "NeedsMoreInfo",
                    "Assigned",
                    "OwnerArrangingExternalMaintenance",
                    "OwnerArrangingExternalEmergencyService",
                    "Cancelled"
                },

                ["NeedsMoreInfo"] = new[]
                {
                    "Submitted",
                    "Analysing",
                    "Cancelled"
                },

                ["Assigned"] = new[]
                {
                    "InProgress",
                    "Cancelled"
                },

                ["InProgress"] = new[]
                {
                    "Completed"
                },

                ["OwnerArrangingExternalMaintenance"] = new[]
                {
                    "ExternalMaintenanceScheduled",
                    "Completed",
                    "Cancelled"
                },

                ["OwnerArrangingExternalEmergencyService"] = new[]
                {
                    "ExternalEmergencyServiceScheduled",
                    "Completed"
                },

                ["ExternalMaintenanceScheduled"] = new[]
                {
                    "InProgress",
                    "Completed",
                    "Cancelled"
                },

                ["ExternalEmergencyServiceScheduled"] = new[]
                {
                    "InProgress",
                    "Completed"
                }
            };

        return transitions.TryGetValue(
                   oldStatus,
                   out var allowed) &&
               allowed.Contains(newStatus);
    }

    // ---------------------------------------------------------
    // DTO MAPPING
    // ---------------------------------------------------------

    private async Task<MaintenanceRequestDto> BuildDtoAsync(
        MaintenanceRequest request)
    {
        var imageUrls =
            await _context.MaintenanceImages
                .AsNoTracking()
                .Where(x =>
                    x.MaintenanceRequestId ==
                    request.Id)
                .Select(x => x.ImageUrl)
                .ToListAsync();

        return new MaintenanceRequestDto
        {
            Id = request.Id,
            TenantId = request.TenantId,
            TenancyId = request.TenancyId,
            PropertyId = request.PropertyId,
            UnitId = request.UnitId,
            PropertyName = request.Property?.Name,
            PropertyAddress = request.Property?.Address,
            UnitName = request.Unit?.UnitLabel,
            Description = request.Description,
            CategoryId = request.CategoryId,
            CategoryName =
                request.Category?.Name,
            RequestType = request.RequestType,
            EmergencyType =
                request.EmergencyType,
            Status = request.Status,
            Priority = request.Priority,
            ImageUrls = imageUrls,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt
        };
    }

    private static PagedMaintenanceRequestsDto EmptyResult(
        int page,
        int pageSize)
    {
        return new PagedMaintenanceRequestsDto
        {
            Requests = new List<MaintenanceRequestDto>(),
            Page = page,
            PageSize = pageSize,
            TotalCount = 0,
            TotalPages = 0
        };
    }
}