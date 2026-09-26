using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class WorkerRecommendationService : IWorkerRecommendationService
{
    private readonly AppDbContext _context;
    private readonly IWorkerService _workerService;

    public WorkerRecommendationService(AppDbContext context, IWorkerService workerService)
    {
        _context = context;
        _workerService = workerService;
    }

    public async Task<RecommendationResponseDto> GetRecommendationAsync(
        int maintenanceRequestId,
        int currentUserId,
        string currentUserRole)
    {
        var request = await _context.MaintenanceRequests
            .Include(r => r.Property)
            .Include(r => r.Unit)
            .Include(r => r.Category)
            .Include(r => r.Tenant)
                .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId);

        if (request == null)
        {
            throw new KeyNotFoundException($"Maintenance request with ID {maintenanceRequestId} not found.");
        }

        // Ownership and authorization check
        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || request.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("You do not have permission to view recommendations for this property.");
            }
        }
        else if (currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("You do not have permission to view technician recommendations.");
        }

        bool isEmergency = string.Equals(request.RequestType, "EMERGENCY", StringComparison.OrdinalIgnoreCase)
                           || string.Equals(request.Priority, "Emergency", StringComparison.OrdinalIgnoreCase);

        var skillRequired = request.Category?.Name?.Trim();
        var propertyCity = request.Property.City?.Trim() ?? string.Empty;

        // Query verified & available workers
        var query = _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Availabilities)
            .Include(w => w.WorkOrders)
            .Where(w => w.VerificationStatus == WorkerVerificationStatus.Verified
                        && w.IsAvailable
                        && w.User != null
                        && w.User.IsActive);

        var allVerifiedWorkers = await query.ToListAsync();

        // 1. Filter by skill (if category exists)
        var matchedWorkers = allVerifiedWorkers.Where(w =>
        {
            if (string.IsNullOrEmpty(skillRequired)) return true;
            return w.Skills.Any(s =>
                s.SkillName.Contains(skillRequired, StringComparison.OrdinalIgnoreCase)
                || skillRequired.Contains(s.SkillName, StringComparison.OrdinalIgnoreCase));
        }).ToList();

        // If no workers match the exact skill, fall back to any verified worker
        if (matchedWorkers.Count == 0 && string.IsNullOrEmpty(skillRequired))
        {
            matchedWorkers = allVerifiedWorkers;
        }

        // 2. Filter by service area if available
        var areaMatchedWorkers = matchedWorkers.Where(w =>
        {
            if (string.IsNullOrEmpty(propertyCity) || !w.ServiceAreas.Any()) return true;
            return w.ServiceAreas.Any(sa =>
                sa.City.Contains(propertyCity, StringComparison.OrdinalIgnoreCase)
                || propertyCity.Contains(sa.City, StringComparison.OrdinalIgnoreCase));
        }).ToList();

        if (areaMatchedWorkers.Count > 0)
        {
            matchedWorkers = areaMatchedWorkers;
        }

        // 3. Emergency vs Normal Path
        Worker? selectedWorker = null;
        DateTime? proposedTime = null;

        if (isEmergency)
        {
            // Emergency: Must be FreeNow with no active conflicting job
            foreach (var worker in matchedWorkers)
            {
                bool isFree = await _workerService.IsWorkerFreeNowAsync(worker.Id);
                if (isFree)
                {
                    selectedWorker = worker;
                    proposedTime = DateTime.UtcNow.AddMinutes(30); // Immediate emergency dispatch
                    break;
                }
            }

            if (selectedWorker == null)
            {
                // Record validation failure
                await RecordValidationResultAsync(request.Id, null, ValidationStatus.Fail,
                    "NO_AVAILABLE_EMERGENCY_WORKER: No verified technician is free right now.");

                return new RecommendationResponseDto
                {
                    Id = request.Id,
                    Title = GetDisplayTitle(request),
                    Property = request.Property.Name,
                    PropertyId = request.PropertyId,
                    Unit = request.Unit?.UnitLabel ?? "N/A",
                    UnitId = request.UnitId,
                    Tenant = request.Tenant?.User?.FullName ?? "Tenant",
                    Priority = request.Priority ?? "Emergency",
                    Description = request.Description,
                    RequestType = request.RequestType,
                    IsEmergency = true,
                    HasAvailableWorker = false,
                    ValidationStatus = "NO_AVAILABLE_EMERGENCY_WORKER",
                    ValidationSummary = "No verified technician with required skill and coverage is free now.",
                    Message = "NO_AVAILABLE_EMERGENCY_WORKER: No technician is available right now. Immediate external emergency maintenance arrangement is recommended."
                };
            }
        }
        else
        {
            // Normal: select worker with least active workload and compute next suitable slot
            selectedWorker = matchedWorkers
                .OrderBy(w => w.WorkOrders.Count(wo => wo.Status == WorkOrderStatus.Assigned || wo.Status == WorkOrderStatus.InProgress))
                .ThenBy(w => w.HourlyRate ?? decimal.MaxValue)
                .FirstOrDefault();

            if (selectedWorker == null)
            {
                await RecordValidationResultAsync(request.Id, null, ValidationStatus.RevisionRequired,
                    "NO_AVAILABLE_WORKER: No suitable technician found matching category and service area.");

                return new RecommendationResponseDto
                {
                    Id = request.Id,
                    Title = GetDisplayTitle(request),
                    Property = request.Property.Name,
                    PropertyId = request.PropertyId,
                    Unit = request.Unit?.UnitLabel ?? "N/A",
                    UnitId = request.UnitId,
                    Tenant = request.Tenant?.User?.FullName ?? "Tenant",
                    Priority = request.Priority ?? "Normal",
                    Description = request.Description,
                    RequestType = request.RequestType,
                    IsEmergency = false,
                    HasAvailableWorker = false,
                    ValidationStatus = "NO_AVAILABLE_WORKER",
                    ValidationSummary = "No suitable technician available.",
                    Message = "No suitable technician found. You can retry, pick another time, or arrange external maintenance."
                };
            }

            proposedTime = CalculateProposedTime(selectedWorker);
        }

        // Deterministic validation pass
        var matchedSkillName = selectedWorker.Skills.FirstOrDefault()?.SkillName ?? skillRequired ?? "General Maintenance";
        var serviceAreaName = selectedWorker.ServiceAreas.FirstOrDefault()?.City ?? propertyCity;

        var existingVal = await _context.ValidationResults
            .FirstOrDefaultAsync(v => v.MaintenanceRequestId == request.Id);

        string validationStatusDisplay;
        string validationSummaryDisplay;

        if (existingVal != null)
        {
            validationStatusDisplay = $"Agent 4 Verified ({existingVal.Status})";
            validationSummaryDisplay = existingVal.Summary;
        }
        else
        {
            validationStatusDisplay = "Passed (Deterministic Rule Validation)";
            validationSummaryDisplay = $"Technician verified, matches skill '{matchedSkillName}', and covers service area.";

            await RecordValidationResultAsync(request.Id, selectedWorker.Id, ValidationStatus.Pass,
                $"Deterministic validation passed: Technician {selectedWorker.User?.FullName} matched for {matchedSkillName} covering {serviceAreaName}.");
        }

        return new RecommendationResponseDto
        {
            Id = request.Id,
            Title = GetDisplayTitle(request),
            Property = request.Property.Name,
            PropertyId = request.PropertyId,
            Unit = request.Unit?.UnitLabel ?? "N/A",
            UnitId = request.UnitId,
            Tenant = request.Tenant?.User?.FullName ?? "Tenant",
            Priority = request.Priority ?? (isEmergency ? "Emergency" : "Normal"),
            Description = request.Description,
            RequestType = request.RequestType,
            IsEmergency = isEmergency,
            HasAvailableWorker = true,
            RecommendedWorkerId = selectedWorker.Id,
            RecommendedWorker = selectedWorker.User?.FullName ?? "Technician",
            WorkerEmail = selectedWorker.User?.Email,
            WorkerMobile = selectedWorker.User?.Mobile,
            WorkerSkill = matchedSkillName,
            HourlyRate = selectedWorker.HourlyRate,
            ServiceArea = string.IsNullOrEmpty(serviceAreaName) ? "Regional Coverage" : serviceAreaName,
            ProposedTime = proposedTime,
            ValidationStatus = validationStatusDisplay,
            ValidationSummary = validationSummaryDisplay,
            Message = "Technician recommendation ready for property owner review and approval."
        };
    }

    public async Task<ApprovalResponseDto> ProcessApprovalAsync(
        int maintenanceRequestId,
        ApprovalRequestDto dto,
        int currentUserId,
        string currentUserRole)
    {
        var request = await _context.MaintenanceRequests
            .Include(r => r.Property)
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId);

        if (request == null)
        {
            throw new KeyNotFoundException($"Maintenance request with ID {maintenanceRequestId} not found.");
        }

        // Ownership check
        int ownerId;
        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null || request.Property.PropertyOwnerId != owner.Id)
            {
                throw new UnauthorizedAccessException("Only the property owner can approve or reject maintenance recommendations.");
            }
            ownerId = owner.Id;
        }
        else if (currentUserRole == "Admin")
        {
            ownerId = request.Property.PropertyOwnerId;
        }
        else
        {
            throw new UnauthorizedAccessException("Unauthorized access.");
        }

        var decisionNormalized = dto.Decision.Trim();
        bool isApprove = string.Equals(decisionNormalized, "Approve", StringComparison.OrdinalIgnoreCase)
                         || string.Equals(decisionNormalized, "Approved", StringComparison.OrdinalIgnoreCase);
        bool isReject = string.Equals(decisionNormalized, "Reject", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(decisionNormalized, "Rejected", StringComparison.OrdinalIgnoreCase);
        bool isRevision = string.Equals(decisionNormalized, "RevisionRequested", StringComparison.OrdinalIgnoreCase)
                          || string.Equals(decisionNormalized, "Request Revision", StringComparison.OrdinalIgnoreCase)
                          || string.Equals(decisionNormalized, "Revise", StringComparison.OrdinalIgnoreCase);

        if (!isApprove && !isReject && !isRevision)
        {
            throw new ArgumentException("Decision must be 'Approve', 'Reject', or 'RevisionRequested'.");
        }

        // Transactional execution
        var isRelational = _context.Database.IsRelational();
        var transaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;

        try
        {
            if (isApprove)
            {
                // Must have a valid worker to assign
                int targetWorkerId;
                if (dto.WorkerId.HasValue && dto.WorkerId.Value > 0)
                {
                    targetWorkerId = dto.WorkerId.Value;
                }
                else
                {
                    // Fall back to finding candidate via recommendation
                    var rec = await GetRecommendationAsync(maintenanceRequestId, currentUserId, currentUserRole);
                    if (!rec.HasAvailableWorker || !rec.RecommendedWorkerId.HasValue)
                    {
                        throw new InvalidOperationException("Cannot approve: no suitable verified technician is available.");
                    }
                    targetWorkerId = rec.RecommendedWorkerId.Value;
                }

                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.Id == targetWorkerId);
                if (worker == null || worker.VerificationStatus != WorkerVerificationStatus.Verified)
                {
                    throw new InvalidOperationException("Cannot assign: Worker is not verified or does not exist.");
                }

                // 1. Record ApprovalDecision
                var approvalDecision = new ApprovalDecision
                {
                    MaintenanceRequestId = request.Id,
                    PropertyOwnerId = ownerId,
                    Decision = "Approved",
                    Notes = dto.Notes?.Trim(),
                    DecidedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ApprovalDecisions.Add(approvalDecision);

                // 2. Create WorkOrder atomically
                bool isEmergency = string.Equals(request.RequestType, "EMERGENCY", StringComparison.OrdinalIgnoreCase)
                                   || string.Equals(request.Priority, "Emergency", StringComparison.OrdinalIgnoreCase);

                var workOrder = new WorkOrder
                {
                    MaintenanceRequestId = request.Id,
                    WorkerId = targetWorkerId,
                    Status = WorkOrderStatus.Assigned,
                    ScheduledDate = dto.ScheduledDate ?? DateTime.UtcNow.AddDays(1),
                    IsEmergency = isEmergency,
                    Notes = dto.Notes?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.WorkOrders.Add(workOrder);

                // 3. Update MaintenanceRequest status
                var oldStatus = request.Status;
                request.Status = "Assigned";
                request.UpdatedAt = DateTime.UtcNow;

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = oldStatus,
                    NewStatus = "Assigned",
                    ChangedByUserId = currentUserId,
                    Note = $"Approved by Property Owner: {dto.Notes?.Trim() ?? "Work order created"}",
                    ChangedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                if (transaction != null) await transaction.CommitAsync();

                return new ApprovalResponseDto
                {
                    Success = true,
                    Decision = "Approved",
                    WorkOrderId = workOrder.Id,
                    CreatedWorkOrder = true,
                    Message = "Work order created and technician assigned successfully."
                };
            }
            else if (isReject)
            {
                var approvalDecision = new ApprovalDecision
                {
                    MaintenanceRequestId = request.Id,
                    PropertyOwnerId = ownerId,
                    Decision = "Rejected",
                    Notes = dto.Notes?.Trim(),
                    DecidedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ApprovalDecisions.Add(approvalDecision);

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = request.Status,
                    NewStatus = request.Status,
                    ChangedByUserId = currentUserId,
                    Note = $"Recommendation rejected by Property Owner: {dto.Notes?.Trim()}",
                    ChangedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                if (transaction != null) await transaction.CommitAsync();

                return new ApprovalResponseDto
                {
                    Success = true,
                    Decision = "Rejected",
                    CreatedWorkOrder = false,
                    Message = "Technician recommendation rejected and decision recorded."
                };
            }
            else
            {
                // RevisionRequested
                var approvalDecision = new ApprovalDecision
                {
                    MaintenanceRequestId = request.Id,
                    PropertyOwnerId = ownerId,
                    Decision = "RevisionRequested",
                    Notes = dto.Notes?.Trim(),
                    DecidedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ApprovalDecisions.Add(approvalDecision);

                _context.MaintenanceStatusHistories.Add(new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = request.Status,
                    NewStatus = request.Status,
                    ChangedByUserId = currentUserId,
                    Note = $"Revision requested by Property Owner: {dto.Notes?.Trim()}",
                    ChangedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                if (transaction != null) await transaction.CommitAsync();

                return new ApprovalResponseDto
                {
                    Success = true,
                    Decision = "RevisionRequested",
                    CreatedWorkOrder = false,
                    Message = "Revision requested and recorded for review."
                };
            }
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

    public async Task<List<RecommendationResponseDto>> GetPendingApprovalsForOwnerAsync(
        int currentUserId,
        string currentUserRole)
    {
        var query = _context.MaintenanceRequests
            .Include(r => r.Property)
            .Include(r => r.Unit)
            .Include(r => r.Category)
            .Include(r => r.Tenant)
                .ThenInclude(t => t.User)
            .AsNoTracking()
            .AsQueryable();

        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _context.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(po => po.UserId == currentUserId);

            if (owner == null) return new List<RecommendationResponseDto>();

            query = query.Where(r => r.Property.PropertyOwnerId == owner.Id);
        }

        // Requests pending approval: not yet completed or cancelled or having an existing active work order
        var pendingRequests = await query
            .Where(r => r.Status != "Completed" && r.Status != "Cancelled")
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToListAsync();

        var results = new List<RecommendationResponseDto>();
        foreach (var req in pendingRequests)
        {
            try
            {
                var rec = await GetRecommendationAsync(req.Id, currentUserId, currentUserRole);
                results.Add(rec);
            }
            catch
            {
                // Skip if error generating recommendation
            }
        }

        return results;
    }

    private async Task RecordValidationResultAsync(
        int maintenanceRequestId,
        int? workerId,
        ValidationStatus status,
        string summary)
    {
        var existing = await _context.ValidationResults
            .FirstOrDefaultAsync(v => v.MaintenanceRequestId == maintenanceRequestId);

        if (existing == null)
        {
            _context.ValidationResults.Add(new ValidationResult
            {
                MaintenanceRequestId = maintenanceRequestId,
                WorkerId = workerId,
                Status = status,
                Summary = summary,
                ValidatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.WorkerId = workerId;
            existing.Status = status;
            existing.Summary = summary;
            existing.ValidatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private static string GetDisplayTitle(MaintenanceRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            return request.Description.Length > 60
                ? request.Description[..57] + "..."
                : request.Description;
        }
        return $"{request.Category?.Name ?? "General"} Maintenance";
    }

    private static DateTime CalculateProposedTime(Worker worker)
    {
        var now = DateTime.UtcNow;
        var tomorrow = now.Date.AddDays(1);

        if (worker.Availabilities != null && worker.Availabilities.Count > 0)
        {
            // Look for the next upcoming slot in the next 7 days
            for (int i = 1; i <= 7; i++)
            {
                var checkDate = now.Date.AddDays(i);
                var slot = worker.Availabilities.FirstOrDefault(a => a.IsActive && a.DayOfWeek == checkDate.DayOfWeek);
                if (slot != null)
                {
                    return checkDate.Add(slot.StartTime);
                }
            }
        }

        // Default tomorrow at 09:00 UTC
        return tomorrow.AddHours(9);
    }
}

