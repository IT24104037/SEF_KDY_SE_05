using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class WorkOrderService : IWorkOrderService
{
    private readonly AppDbContext _context;

    public WorkOrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WorkOrderListResponseDto> GetWorkOrdersAsync(
        int currentUserId,
        string currentUserRole,
        string? status = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.WorkOrders
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.User)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Property)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Unit)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Tenant)
                    .ThenInclude(t => t.User)
            .AsNoTracking()
            .AsQueryable();

        // 1. Role-based scoping
        if (currentUserRole == "MaintenanceWorker")
        {
            var worker = await _context.Workers
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.UserId == currentUserId);

            if (worker == null)
            {
                return new WorkOrderListResponseDto();
            }

            query = query.Where(wo => wo.WorkerId == worker.Id);
        }
        else if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null)
            {
                return new WorkOrderListResponseDto();
            }

            query = query.Where(wo => wo.MaintenanceRequest.Property.PropertyOwnerId == owner.Id);
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("You do not have permission to view work orders.");
        }

        // 2. Status filter
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<WorkOrderStatus>(status.Trim(), true, out var parsedStatus))
            {
                query = query.Where(wo => wo.Status == parsedStatus);
            }
        }

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(wo => wo.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new WorkOrderListResponseDto
        {
            WorkOrders = orders.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<WorkOrderResponseDto?> GetWorkOrderByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole)
    {
        var workOrder = await _context.WorkOrders
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.User)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Property)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Unit)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Tenant)
                    .ThenInclude(t => t.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(wo => wo.Id == id);

        if (workOrder == null)
        {
            return null;
        }

        // Authorization check
        if (currentUserRole == "MaintenanceWorker")
        {
            var worker = await _context.Workers
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.UserId == currentUserId);

            if (worker == null || workOrder.WorkerId != worker.Id)
            {
                throw new UnauthorizedAccessException("You do not have permission to access this work order.");
            }
        }
        else if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || workOrder.MaintenanceRequest.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You do not have permission to access this work order.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("You do not have permission to access this work order.");
        }

        return MapToDto(workOrder);
    }

    public async Task<WorkOrderResponseDto> UpdateWorkOrderStatusAsync(
        int id,
        UpdateWorkOrderStatusDto dto,
        int currentUserId,
        string currentUserRole)
    {
        var workOrder = await _context.WorkOrders
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.User)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Property)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Unit)
            .Include(wo => wo.MaintenanceRequest)
                .ThenInclude(mr => mr.Tenant)
                    .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(wo => wo.Id == id);

        if (workOrder == null)
        {
            throw new KeyNotFoundException($"Work order #{id} not found.");
        }

        // Check user permission
        int? workerId = null;
        int? ownerId = null;

        if (currentUserRole == "MaintenanceWorker")
        {
            var worker = await _context.Workers
                .FirstOrDefaultAsync(w => w.UserId == currentUserId);

            if (worker == null || workOrder.WorkerId != worker.Id)
            {
                throw new UnauthorizedAccessException("You can only update work orders assigned to you.");
            }
            workerId = worker.Id;
        }
        else if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || workOrder.MaintenanceRequest.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You can only manage work orders for properties you own.");
            }
            ownerId = owner.Id;
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Unauthorized role for updating work order status.");
        }

        if (!Enum.TryParse<WorkOrderStatus>(dto.Status.Trim(), true, out var targetStatus))
        {
            throw new ArgumentException($"Invalid work order status '{dto.Status}'. Allowed: InProgress, Completed, Cancelled.");
        }

        var currentStatus = workOrder.Status;

        // Server-enforced transition validation
        if (currentStatus == WorkOrderStatus.Completed)
        {
            throw new InvalidOperationException("Cannot modify a completed work order.");
        }
        if (currentStatus == WorkOrderStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot modify a cancelled work order.");
        }

        var isRelational = _context.Database.IsRelational();
        var transaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;

        try
        {
            if (targetStatus == WorkOrderStatus.InProgress)
            {
                if (currentStatus != WorkOrderStatus.Assigned)
                {
                    throw new InvalidOperationException($"Cannot transition from {currentStatus} to InProgress. Must be in Assigned state.");
                }

                workOrder.Status = WorkOrderStatus.InProgress;
                workOrder.StartedAt ??= DateTime.UtcNow;
                workOrder.UpdatedAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Notes))
                {
                    workOrder.Notes = dto.Notes.Trim();
                }

                // Update request
                var oldReqStatus = workOrder.MaintenanceRequest.Status;
                workOrder.MaintenanceRequest.Status = "InProgress";
                workOrder.MaintenanceRequest.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = workOrder.MaintenanceRequestId,
                    OldStatus = oldReqStatus,
                    NewStatus = "InProgress",
                    ChangedByUserId = currentUserId,
                    Note = dto.Notes?.Trim() ?? "Work order started by technician",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else if (targetStatus == WorkOrderStatus.Completed)
            {
                if (currentStatus != WorkOrderStatus.InProgress)
                {
                    throw new InvalidOperationException($"Cannot complete job directly from {currentStatus}. Work order must be started (InProgress) before completing.");
                }

                if (string.IsNullOrWhiteSpace(dto.CompletionNotes))
                {
                    throw new ArgumentException("Completion notes are required when completing a work order.");
                }

                workOrder.Status = WorkOrderStatus.Completed;
                workOrder.CompletedAt = DateTime.UtcNow;
                workOrder.CompletionNotes = dto.CompletionNotes.Trim();
                if (!string.IsNullOrWhiteSpace(dto.CompletionEvidenceUrl))
                {
                    workOrder.CompletionEvidenceUrl = dto.CompletionEvidenceUrl.Trim();
                }
                workOrder.UpdatedAt = DateTime.UtcNow;

                // Update request
                var oldReqStatus = workOrder.MaintenanceRequest.Status;
                workOrder.MaintenanceRequest.Status = "Completed";
                workOrder.MaintenanceRequest.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = workOrder.MaintenanceRequestId,
                    OldStatus = oldReqStatus,
                    NewStatus = "Completed",
                    ChangedByUserId = currentUserId,
                    Note = $"Work order completed. Evidence: {dto.CompletionNotes.Trim()}",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else if (targetStatus == WorkOrderStatus.Cancelled)
            {
                if (currentUserRole == "MaintenanceWorker")
                {
                    throw new UnauthorizedAccessException("Workers cannot cancel work orders. Only property owners or administrators can cancel a job.");
                }

                workOrder.Status = WorkOrderStatus.Cancelled;
                workOrder.UpdatedAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Notes))
                {
                    workOrder.Notes = dto.Notes.Trim();
                }

                // Update request
                var oldReqStatus = workOrder.MaintenanceRequest.Status;
                workOrder.MaintenanceRequest.Status = "Cancelled";
                workOrder.MaintenanceRequest.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = workOrder.MaintenanceRequestId,
                    OldStatus = oldReqStatus,
                    NewStatus = "Cancelled",
                    ChangedByUserId = currentUserId,
                    Note = $"Work order cancelled: {dto.Notes?.Trim() ?? "Cancelled by owner/admin"}",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else
            {
                throw new InvalidOperationException($"Unsupported target status '{targetStatus}'.");
            }

            await _context.SaveChangesAsync();
            if (transaction != null) await transaction.CommitAsync();

            return MapToDto(workOrder);
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

    private static WorkOrderResponseDto MapToDto(WorkOrder wo)
    {
        var req = wo.MaintenanceRequest;
        return new WorkOrderResponseDto
        {
            Id = wo.Id,
            MaintenanceRequestId = wo.MaintenanceRequestId,
            RequestTitle = !string.IsNullOrWhiteSpace(req?.Description)
                ? (req.Description.Length > 60 ? req.Description[..57] + "..." : req.Description)
                : "Maintenance Request",
            Description = req?.Description ?? string.Empty,
            PropertyName = req?.Property?.Name ?? string.Empty,
            UnitLabel = req?.Unit?.UnitLabel ?? string.Empty,
            TenantName = req?.Tenant?.User?.FullName ?? "Tenant",
            Priority = req?.Priority ?? "Normal",
            IsEmergency = wo.IsEmergency,
            WorkerId = wo.WorkerId,
            WorkerName = wo.Worker?.User?.FullName ?? "Technician",
            WorkerEmail = wo.Worker?.User?.Email,
            WorkerMobile = wo.Worker?.User?.Mobile,
            Status = wo.Status.ToString(),
            ScheduledDate = wo.ScheduledDate,
            StartedAt = wo.StartedAt,
            CompletedAt = wo.CompletedAt,
            Notes = wo.Notes,
            CompletionNotes = wo.CompletionNotes,
            CompletionEvidenceUrl = wo.CompletionEvidenceUrl,
            CreatedAt = wo.CreatedAt,
            UpdatedAt = wo.UpdatedAt
        };
    }
}
