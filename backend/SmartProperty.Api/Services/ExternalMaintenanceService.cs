using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class ExternalMaintenanceService : IExternalMaintenanceService
{
    private readonly AppDbContext _context;

    public ExternalMaintenanceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ExternalArrangementResponseDto> CreateArrangementAsync(
        int maintenanceRequestId,
        CreateExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole)
    {
        if (string.IsNullOrWhiteSpace(dto.ProviderName))
        {
            throw new ArgumentException("Provider name is required.");
        }

        var request = await _context.MaintenanceRequests
            .Include(r => r.Property)
            .Include(r => r.Unit)
            .Include(r => r.Tenant)
                .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId);

        if (request == null)
        {
            throw new KeyNotFoundException($"Maintenance request #{maintenanceRequestId} not found.");
        }

        // Ownership and authorization check
        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || request.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You can only arrange external maintenance for properties you own.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role for arranging external maintenance.");
        }

        bool isEmergency = string.Equals(request.RequestType, "EMERGENCY", StringComparison.OrdinalIgnoreCase)
                           || string.Equals(request.Priority, "Emergency", StringComparison.OrdinalIgnoreCase);

        var isRelational = _context.Database.IsRelational();
        var transaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;

        try
        {
            // Create ExternalMaintenanceArrangement (strictly no fake worker record is created)
            var arrangement = new ExternalMaintenanceArrangement
            {
                MaintenanceRequestId = request.Id,
                ProviderName = dto.ProviderName.Trim(),
                ContactPhone = dto.ContactPhone?.Trim(),
                ContactEmail = dto.ContactEmail?.Trim(),
                ScheduledDateTime = dto.ScheduledDateTime,
                EstimatedArrival = dto.EstimatedArrival?.Trim(),
                EstimatedCost = dto.EstimatedCost,
                Note = dto.Note?.Trim(),
                IsEmergency = isEmergency,
                Status = "Scheduled",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ExternalMaintenanceArrangements.Add(arrangement);

            // Update MaintenanceRequest status based on emergency vs normal rules
            var oldStatus = request.Status;
            var targetStatus = isEmergency
                ? "OwnerArrangingExternalEmergencyService"
                : "OwnerArrangingExternalMaintenance";

            request.Status = targetStatus;
            request.UpdatedAt = DateTime.UtcNow;

            _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
            {
                MaintenanceRequestId = request.Id,
                OldStatus = oldStatus,
                NewStatus = targetStatus,
                ChangedByUserId = currentUserId,
                Note = isEmergency
                    ? $"Emergency external maintenance arranged with {dto.ProviderName.Trim()}: {dto.Note?.Trim()}"
                    : $"External maintenance arranged with {dto.ProviderName.Trim()}: {dto.Note?.Trim()}",
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            if (transaction != null) await transaction.CommitAsync();

            return MapToDto(arrangement, request);
        }
        catch
        {
            if (transaction != null) await transaction.RollbackAsync();
            throw;
        }
        finally
        {
            if (transaction != null) await transaction.DisposeAsync();
        }
    }

    public async Task<ExternalArrangementResponseDto> ConfirmArrangementAsync(
        int id,
        ConfirmExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole)
    {
        var arrangement = await _context.ExternalMaintenanceArrangements
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Property)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Unit)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Tenant)
                    .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (arrangement == null)
        {
            throw new KeyNotFoundException($"External maintenance arrangement #{id} not found.");
        }

        var request = arrangement.MaintenanceRequest;

        // Ownership check
        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || request.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You can only confirm external arrangements for properties you own.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role for confirming external arrangements.");
        }

        var isRelational = _context.Database.IsRelational();
        var transaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;

        try
        {
            arrangement.Status = "Confirmed";
            if (!string.IsNullOrWhiteSpace(dto.EstimatedArrival))
            {
                arrangement.EstimatedArrival = dto.EstimatedArrival.Trim();
            }
            if (dto.ScheduledDateTime.HasValue)
            {
                arrangement.ScheduledDateTime = dto.ScheduledDateTime.Value;
            }
            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                arrangement.Note = dto.Note.Trim();
            }
            arrangement.UpdatedAt = DateTime.UtcNow;

            // Target request status transition
            var oldStatus = request.Status;
            var targetStatus = arrangement.IsEmergency
                ? "ExternalEmergencyServiceScheduled"
                : "ExternalMaintenanceScheduled";

            request.Status = targetStatus;
            request.UpdatedAt = DateTime.UtcNow;

            _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
            {
                MaintenanceRequestId = request.Id,
                OldStatus = oldStatus,
                NewStatus = targetStatus,
                ChangedByUserId = currentUserId,
                Note = $"External arrangement confirmed with {arrangement.ProviderName}. ETA: {arrangement.EstimatedArrival ?? "Confirmed schedule"}",
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            if (transaction != null) await transaction.CommitAsync();

            return MapToDto(arrangement, request);
        }
        catch
        {
            if (transaction != null) await transaction.RollbackAsync();
            throw;
        }
        finally
        {
            if (transaction != null) await transaction.DisposeAsync();
        }
    }

    public async Task<ExternalArrangementResponseDto> UpdateArrangementAsync(
        int id,
        UpdateExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole)
    {
        var arrangement = await _context.ExternalMaintenanceArrangements
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Property)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Unit)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Tenant)
                    .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (arrangement == null)
        {
            throw new KeyNotFoundException($"External maintenance arrangement #{id} not found.");
        }

        var request = arrangement.MaintenanceRequest;

        // Ownership check
        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || request.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You can only manage external arrangements for properties you own.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role for updating external arrangements.");
        }

        if (!string.IsNullOrWhiteSpace(dto.ProviderName))
            arrangement.ProviderName = dto.ProviderName.Trim();

        if (dto.ContactPhone != null)
            arrangement.ContactPhone = dto.ContactPhone.Trim();

        if (dto.ContactEmail != null)
            arrangement.ContactEmail = dto.ContactEmail.Trim();

        if (dto.EstimatedArrival != null)
            arrangement.EstimatedArrival = dto.EstimatedArrival.Trim();

        if (dto.ScheduledDateTime.HasValue)
            arrangement.ScheduledDateTime = dto.ScheduledDateTime.Value;

        if (dto.EstimatedCost.HasValue)
            arrangement.EstimatedCost = dto.EstimatedCost.Value;

        if (dto.Note != null)
            arrangement.Note = dto.Note.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            var newStatus = dto.Status.Trim();
            arrangement.Status = newStatus;

            if (string.Equals(newStatus, "Completed", StringComparison.OrdinalIgnoreCase))
            {
                var oldStatus = request.Status;
                request.Status = "Completed";
                request.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = oldStatus,
                    NewStatus = "Completed",
                    ChangedByUserId = currentUserId,
                    Note = $"External maintenance completed by {arrangement.ProviderName}",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else if (string.Equals(newStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                var oldStatus = request.Status;
                request.Status = "Cancelled";
                request.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = oldStatus,
                    NewStatus = "Cancelled",
                    ChangedByUserId = currentUserId,
                    Note = $"External maintenance arrangement cancelled: {arrangement.ProviderName}",
                    ChangedAt = DateTime.UtcNow
                });
            }
        }

        arrangement.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(arrangement, request);
    }

    public async Task<List<ExternalArrangementResponseDto>> GetArrangementsAsync(
        int currentUserId,
        string currentUserRole,
        int? maintenanceRequestId = null)
    {
        var query = _context.ExternalMaintenanceArrangements
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Property)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Unit)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Tenant)
                    .ThenInclude(t => t.User)
            .AsNoTracking()
            .AsQueryable();

        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null)
            {
                return new List<ExternalArrangementResponseDto>();
            }

            query = query.Where(a => a.MaintenanceRequest.Property.PropertyOwnerId == owner.Id);
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role for viewing external arrangements.");
        }

        if (maintenanceRequestId.HasValue)
        {
            query = query.Where(a => a.MaintenanceRequestId == maintenanceRequestId.Value);
        }

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return list.Select(a => MapToDto(a, a.MaintenanceRequest)).ToList();
    }

    public async Task<ExternalArrangementResponseDto?> GetArrangementByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole)
    {
        var arrangement = await _context.ExternalMaintenanceArrangements
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Property)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Unit)
            .Include(a => a.MaintenanceRequest)
                .ThenInclude(r => r.Tenant)
                    .ThenInclude(t => t.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (arrangement == null)
        {
            return null;
        }

        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || arrangement.MaintenanceRequest.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You can only view arrangements for your own properties.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role.");
        }

        return MapToDto(arrangement, arrangement.MaintenanceRequest);
    }

    private static ExternalArrangementResponseDto MapToDto(
        ExternalMaintenanceArrangement arrangement,
        MaintenanceRequest request)
    {
        return new ExternalArrangementResponseDto
        {
            Id = arrangement.Id,
            MaintenanceRequestId = arrangement.MaintenanceRequestId,
            RequestTitle = !string.IsNullOrWhiteSpace(request.Description)
                ? (request.Description.Length > 60 ? request.Description[..57] + "..." : request.Description)
                : "Maintenance Request",
            Description = request.Description,
            PropertyName = request.Property?.Name ?? string.Empty,
            UnitLabel = request.Unit?.UnitLabel ?? string.Empty,
            TenantName = request.Tenant?.User?.FullName ?? "Tenant",
            Priority = request.Priority ?? (arrangement.IsEmergency ? "Emergency" : "Normal"),
            IsEmergency = arrangement.IsEmergency,
            ProviderName = arrangement.ProviderName,
            ContactPhone = arrangement.ContactPhone,
            ContactEmail = arrangement.ContactEmail,
            EstimatedArrival = arrangement.EstimatedArrival,
            ScheduledDateTime = arrangement.ScheduledDateTime,
            EstimatedCost = arrangement.EstimatedCost,
            Note = arrangement.Note,
            Status = arrangement.Status,
            CreatedAt = arrangement.CreatedAt,
            UpdatedAt = arrangement.UpdatedAt
        };
    }
}
