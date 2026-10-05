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
        // If an active work order already exists for this request, return the assigned worker
        var existingWorkOrder = await _context.WorkOrders
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.User)
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.Skills)
            .Include(wo => wo.Worker)
                .ThenInclude(w => w.ServiceAreas)
            .FirstOrDefaultAsync(wo => wo.MaintenanceRequestId == maintenanceRequestId &&
                                       wo.Status != WorkOrderStatus.Cancelled);
        if (existingWorkOrder != null)
        {
            var assignedWorker = existingWorkOrder.Worker;
            var assignedSkillName = assignedWorker.Skills.FirstOrDefault()?.SkillName ?? skillRequired ?? "General Maintenance";
            var assignedServiceArea = assignedWorker.ServiceAreas.FirstOrDefault()?.City ?? propertyCity;
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
                RecommendedWorkerId = assignedWorker.Id,
                RecommendedWorker = assignedWorker.User?.FullName ?? "Assigned Technician",
                WorkerEmail = assignedWorker.User?.Email,
                WorkerMobile = assignedWorker.User?.Mobile,
                WorkerSkill = assignedSkillName,
                HourlyRate = assignedWorker.HourlyRate,
                ServiceArea = string.IsNullOrEmpty(assignedServiceArea) ? "Regional Coverage" : assignedServiceArea,
                ProposedTime = existingWorkOrder.ScheduledDate,
                ValidationStatus = "Approved & Assigned",
                ValidationSummary = $"Technician {assignedWorker.User?.FullName} is approved and officially assigned to Work Order #{existingWorkOrder.Id}.",
                Message = $"Work Order #{existingWorkOrder.Id} is currently {existingWorkOrder.Status}."
            };
        }
        // Check if Agent 3 already selected a worker via WorkerMatchRecommendations
     // Get the LATEST Agent 3 result.
// Do not filter WorkerId != null because NO_WORKER results must also be respected.
        var aiMatch = await _context.WorkerMatchRecommendations
            .Where(r => r.MaintenanceRequestId == maintenanceRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();
        // Agent 3 has not completed
        if (aiMatch == null)
        {
            return BuildUnavailableResponse(
                request,
                isEmergency,
                "AGENT3_NOT_COMPLETED",
                "Technician matching has not completed yet.");
        }
        // Agent 3 completed but did not find a suitable worker
        if (!string.Equals(
                aiMatch.Result,
                "MATCH_FOUND",
                StringComparison.OrdinalIgnoreCase) ||
            !aiMatch.WorkerId.HasValue)
        {
            return BuildUnavailableResponse(
                request,
                isEmergency,
                aiMatch.Result,
                aiMatch.Reason
                ?? "No suitable worker is currently available.");
        }
        // Load exactly the worker selected by Agent 3
        var matchedWorker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Availabilities)
            .FirstOrDefaultAsync(
                w => w.Id == aiMatch.WorkerId.Value);
        // Safety check - Agent 3 points to a worker that no longer exists
        if (matchedWorker == null)
        {
            return BuildUnavailableResponse(
                request,
                isEmergency,
                "MATCHED_WORKER_NOT_FOUND",
                "The technician selected by Agent 3 could not be found.");
        }
        // Find the EXACT skill matched by Agent 3
        var matchedSkill = matchedWorker.Skills
            .FirstOrDefault(s =>
                string.Equals(
                    s.SkillName?.Trim(),
                    aiMatch.RequiredSkill?.Trim(),
                    StringComparison.OrdinalIgnoreCase));
        // Extra protection against wrong skill
        if (matchedSkill == null)
        {
            return BuildUnavailableResponse(
                request,
                isEmergency,
                "SKILL_MISMATCH",
                $"The selected technician does not have the required skill '{aiMatch.RequiredSkill}'.");
        }
        // Check Agent 4 result
        var valResult = await _context.ValidationResults
            .Where(v =>
                v.MaintenanceRequestId == maintenanceRequestId &&
                v.WorkerId == matchedWorker.Id)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
        var matchedServiceArea = matchedWorker.ServiceAreas
            .FirstOrDefault(sa =>
                string.Equals(
                    sa.City?.Trim(),
                    propertyCity,
                    StringComparison.OrdinalIgnoreCase));
        if (valResult == null)
            {
                return new RecommendationResponseDto
                {
                    Id = request.Id,
                    Title = GetDisplayTitle(request),
                    Property = request.Property.Name,
                    PropertyId = request.PropertyId,
                    Unit = request.Unit?.UnitLabel ?? "N/A",
                    UnitId = request.UnitId,
                    Tenant = request.Tenant?.User?.FullName ?? "Tenant",
                    Priority = aiMatch.Priority ??
                            request.Priority ??
                            "Normal",
                    Description = request.Description,
                    RequestType = request.RequestType,
                    IsEmergency = isEmergency,
                    HasAvailableWorker = true,
                    RecommendedWorkerId = matchedWorker.Id,
                    RecommendedWorker = matchedWorker.User?.FullName,
                    WorkerEmail = matchedWorker.User?.Email,
                    WorkerMobile = matchedWorker.User?.Mobile,
                    WorkerSkill = matchedSkill.SkillName,
                    HourlyRate = matchedWorker.HourlyRate,
                    ServiceArea = matchedWorker.ServiceAreas
                        .FirstOrDefault(sa =>
                            string.Equals(
                                sa.City?.Trim(),
                                propertyCity,
                                StringComparison.OrdinalIgnoreCase))
                        ?.City,
                    ProposedTime = aiMatch.SuggestedDateTime,
                    ValidationStatus =
                        "PENDING_AGENT4_VALIDATION",
                    ValidationSummary =
                        "Agent 3 found a candidate, but Agent 4 validation has not completed.",
                    Message =
                        "Candidate worker found. Waiting for safety and compliance validation."
                };
            }
        // Agent 4 rejected the worker
        if (valResult.Status != ValidationStatus.Pass)
        {
            return BuildUnavailableResponse(
                request,
                isEmergency,
                $"AGENT4_{valResult.Status.ToString().ToUpperInvariant()}",
                valResult.Summary);
        }
        // SUCCESS - Agent 3 matched the correct skill and Agent 4 passed
        return new RecommendationResponseDto
        {
            Id = request.Id,
            Title = GetDisplayTitle(request),
            Property = request.Property.Name,
            PropertyId = request.PropertyId,
            Unit = request.Unit?.UnitLabel ?? "N/A",
            UnitId = request.UnitId,
            Tenant = request.Tenant?.User?.FullName ?? "Tenant",
            Priority = aiMatch.Priority
                    ?? request.Priority
                    ?? (isEmergency ? "Emergency" : "Normal"),
            Description = request.Description,
            RequestType = request.RequestType,
            IsEmergency = isEmergency,
            HasAvailableWorker = true,
            RecommendedWorkerId = matchedWorker.Id,
            RecommendedWorker =
                matchedWorker.User?.FullName
                ?? "Technician",
            WorkerEmail = matchedWorker.User?.Email,
            WorkerMobile = matchedWorker.User?.Mobile,
            WorkerSkill = matchedSkill.SkillName,
            HourlyRate = matchedWorker.HourlyRate,
            ServiceArea =
                matchedServiceArea?.City
                ?? propertyCity,
            ProposedTime =
                aiMatch.SuggestedDateTime,
            ValidationStatus =
                $"Agent 4 Verified ({valResult.Status})",
            ValidationSummary =
                valResult.Summary,
            Message =
                $"Technician {matchedWorker.User?.FullName} was matched by Agent 3 and verified by Agent 4."
        };
    }
    private static RecommendationResponseDto BuildUnavailableResponse(
    MaintenanceRequest request,
    bool isEmergency,
    string status,
    string message)
{
    return new RecommendationResponseDto
    {
        Id = request.Id,
        Title = GetDisplayTitle(request),
        Property = request.Property.Name,
        PropertyId = request.PropertyId,
        Unit = request.Unit?.UnitLabel ?? "N/A",
        UnitId = request.UnitId,
        Tenant = request.Tenant?.User?.FullName ?? "Tenant",
        Priority = request.Priority
                   ?? (isEmergency ? "Emergency" : "Normal"),
        Description = request.Description,
        RequestType = request.RequestType,
        IsEmergency = isEmergency,
        HasAvailableWorker = false,
        RecommendedWorkerId = null,
        RecommendedWorker = null,
        WorkerEmail = null,
        WorkerMobile = null,
        WorkerSkill = null,
        HourlyRate = null,
        ServiceArea = null,
        ProposedTime = null,
        ValidationStatus = status,
        ValidationSummary = message,
        Message = message
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
                // Prevent duplicate approval
                var existingOrder = await _context.WorkOrders
                    .FirstOrDefaultAsync(wo => wo.MaintenanceRequestId == maintenanceRequestId && wo.Status != WorkOrderStatus.Cancelled);
                if (existingOrder != null)
                {
                    throw new InvalidOperationException($"This maintenance request has already been approved and assigned to Work Order #{existingOrder.Id}.");
                }
                // Must have a valid worker to assign
               // Must use the exact worker selected by Agent 3
                var latestMatch = await _context.WorkerMatchRecommendations
                    .Where(x =>
                        x.MaintenanceRequestId == maintenanceRequestId)
                    .OrderByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();
                // Agent 3 must have successfully matched a worker
                if (latestMatch == null ||
                    !string.Equals(
                        latestMatch.Result,
                        "MATCH_FOUND",
                        StringComparison.OrdinalIgnoreCase) ||
                    !latestMatch.WorkerId.HasValue)
                {
                    throw new InvalidOperationException(
                        "Cannot approve: Agent 3 has not produced a valid technician match.");
                }
                var targetWorkerId = latestMatch.WorkerId.Value;
                // If frontend sends WorkerId,
                // it MUST be the same worker selected by Agent 3
                if (dto.WorkerId.HasValue &&
                    dto.WorkerId.Value > 0 &&
                    dto.WorkerId.Value != targetWorkerId)
                {
                    throw new InvalidOperationException(
                        "Cannot approve a different technician. The selected worker must match the technician recommended by Agent 3.");
                }
                // Agent 4 must have validated the SAME worker
                var latestValidation = await _context.ValidationResults
                    .Where(v =>
                        v.MaintenanceRequestId == maintenanceRequestId &&
                        v.WorkerId == targetWorkerId)
                    .OrderByDescending(v => v.CreatedAt)
                    .FirstOrDefaultAsync();
                if (latestValidation == null)
                {
                    throw new InvalidOperationException(
                        "Cannot approve: Agent 4 validation has not completed for this technician.");
                }
                if (latestValidation.Status != ValidationStatus.Pass)
                {
                    throw new InvalidOperationException(
                        $"Cannot approve: Agent 4 validation status is {latestValidation.Status}.");
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
    public async Task<ApprovalResponseDto> ProcessManualDecisionAsync(
    int maintenanceRequestId,
    ManualDecisionRequestDto dto,
    int currentUserId,
    string currentUserRole)
{
    if (dto == null)
    {
        throw new ArgumentNullException(nameof(dto));
    }
    if (!string.Equals(
            currentUserRole,
            "PropertyOwner",
            StringComparison.OrdinalIgnoreCase))
    {
        throw new UnauthorizedAccessException(
            "Only the Property Owner can make this manual decision.");
    }
    if (string.IsNullOrWhiteSpace(dto.Message))
    {
        throw new ArgumentException(
            "A message to the tenant is required.");
    }
    var message = dto.Message.Trim();
    if (message.Length > 1000)
    {
        throw new ArgumentException(
            "The message cannot exceed 1000 characters.");
    }
    var decisionInput = dto.Decision?.Trim() ?? string.Empty;
    var isApprove =
        string.Equals(
            decisionInput,
            "Approve",
            StringComparison.OrdinalIgnoreCase) ||
        string.Equals(
            decisionInput,
            "Approved",
            StringComparison.OrdinalIgnoreCase);
    var isReject =
        string.Equals(
            decisionInput,
            "Reject",
            StringComparison.OrdinalIgnoreCase) ||
        string.Equals(
            decisionInput,
            "Rejected",
            StringComparison.OrdinalIgnoreCase);
    if (!isApprove && !isReject)
    {
        throw new ArgumentException(
            "Decision must be 'Approve' or 'Reject'.");
    }
    var request = await _context.MaintenanceRequests
        .Include(r => r.Property)
        .FirstOrDefaultAsync(
            r => r.Id == maintenanceRequestId);
    if (request == null)
    {
        throw new KeyNotFoundException(
            $"Maintenance request with ID {maintenanceRequestId} was not found.");
    }
    // ---------------------------------------------------------
    // OWNER OWNERSHIP CHECK
    // ---------------------------------------------------------
    var owner = await _context.PropertyOwners
        .FirstOrDefaultAsync(
            x => x.UserId == currentUserId);
    if (owner == null ||
        request.Property.PropertyOwnerId != owner.Id)
    {
        throw new UnauthorizedAccessException(
            "You do not have permission to make a decision for this request.");
    }
    var latestWorkflow = await _context.AgentWorkflows
    .Where(x =>
        x.MaintenanceRequestId == maintenanceRequestId)
    .OrderByDescending(x => x.CreatedAt)
    .FirstOrDefaultAsync();
var emergencyServicesRequired =
    latestWorkflow != null &&
    (
        string.Equals(
            latestWorkflow.ApprovalStatus,
            "EmergencyServicesRequired",
            StringComparison.OrdinalIgnoreCase)
        ||
        string.Equals(
            latestWorkflow.CurrentStep,
            "Emergency Services Required",
            StringComparison.OrdinalIgnoreCase)
    );
var latestMatch = await _context.WorkerMatchRecommendations
    .Where(x =>
        x.MaintenanceRequestId == maintenanceRequestId)
    .OrderByDescending(x => x.CreatedAt)
    .FirstOrDefaultAsync();
var allowedNoWorkerResults =
    new HashSet<string>(
        StringComparer.OrdinalIgnoreCase)
    {
        "NO_WORKER_WITH_REQUIRED_SKILL",
        "NO_WORKER_IN_LOCATION",
        "NO_AVAILABLE_WORKER",
        "NO_AVAILABLE_EMERGENCY_WORKER"
    };
// Normal maintenance/emergency:
// Agent 3 must explicitly confirm no worker.
//
// Life-safety emergency:
// Agent 3 was intentionally skipped, so no match record is required.
if (!emergencyServicesRequired)
{
    if (latestMatch == null)
    {
        throw new InvalidOperationException(
            "Agent 3 technician matching has not completed.");
    }
    if (!allowedNoWorkerResults.Contains(
            latestMatch.Result ?? string.Empty))
    {
        if (string.Equals(
                latestMatch.Result,
                "MATCH_FOUND",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "A technician was matched. Use the normal Property Owner approval process.");
        }
        throw new InvalidOperationException(
            "Manual owner decision is only allowed when Agent 3 confirms that no suitable worker is available.");
    }
}
    // ---------------------------------------------------------
    // EXTRA SAFETY:
    // THERE MUST NOT BE AN ACTIVE WORK ORDER
    // ---------------------------------------------------------
    var activeWorkOrder = await _context.WorkOrders
        .FirstOrDefaultAsync(x =>
            x.MaintenanceRequestId == maintenanceRequestId &&
            x.Status != WorkOrderStatus.Cancelled);
    if (activeWorkOrder != null)
    {
        throw new InvalidOperationException(
            "This request already has an active work order.");
    }
    // ---------------------------------------------------------
    // PREVENT DUPLICATE MANUAL DECISION
    // ---------------------------------------------------------
var decisionStartTime =
    emergencyServicesRequired
        ? latestWorkflow?.CreatedAt ?? request.CreatedAt
        : latestMatch?.CreatedAt ?? request.CreatedAt;
var alreadyDecided = await _context.ApprovalDecisions
    .AnyAsync(x =>
        x.MaintenanceRequestId == maintenanceRequestId &&
        x.DecidedAt >= decisionStartTime &&
        (
            x.Decision == "Approved" ||
            x.Decision == "Rejected"
        ));
    if (alreadyDecided)
    {
        throw new InvalidOperationException(
            "A decision has already been recorded for this no-worker result.");
    }
    var finalDecision =
        isApprove
            ? "Approved"
            : "Rejected";
    // ---------------------------------------------------------
    // SAVE USING EXISTING APPROVAL DECISION TABLE
    // ---------------------------------------------------------
    var approvalDecision = new ApprovalDecision
    {
        MaintenanceRequestId = request.Id,
        PropertyOwnerId = owner.Id,
        Decision = finalDecision,
        Notes = message,
        DecidedAt = DateTime.UtcNow,
        CreatedAt = DateTime.UtcNow
    };
    _context.ApprovalDecisions.Add(
        approvalDecision);
    // Keep an audit trail as well.
    _context.MaintenanceStatusHistories.Add(
        new MaintenanceStatusHistory
        {
            MaintenanceRequestId = request.Id,
            OldStatus = request.Status,
            NewStatus = request.Status,
            ChangedByUserId = currentUserId,
            Note =
                $"Manual owner decision - {finalDecision}: {message}",
            ChangedAt = DateTime.UtcNow
        });
    request.UpdatedAt = DateTime.UtcNow;
    // Mark the existing AI workflow so that the manual box
    // does not appear again after page refresh.
   var workflow = latestWorkflow;
    if (workflow != null)
    {
        workflow.ApprovalStatus =
            isApprove
                ? "ManualApproved"
                : "ManualRejected";
        workflow.UpdatedAt =
            DateTime.UtcNow;
    }
    await _context.SaveChangesAsync();
    return new ApprovalResponseDto
    {
        Success = true,
        Decision = finalDecision,
        CreatedWorkOrder = false,
        Message = isApprove
            ? "Manual approval and tenant message recorded successfully."
            : "Manual rejection and tenant message recorded successfully."
    };
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
        // Requests pending approval: must NOT have an active work order and must not be Assigned/InProgress/Completed/Cancelled
        var assignedRequestIds = await _context.WorkOrders
            .Where(wo => wo.Status != WorkOrderStatus.Cancelled)
            .Select(wo => wo.MaintenanceRequestId)
            .Distinct()
            .ToListAsync();
        var pendingRequests = await query
            .Where(r => r.Status != "Assigned" &&
                        r.Status != "InProgress" &&
                        r.Status != "Completed" &&
                        r.Status != "Cancelled" &&
                        !assignedRequestIds.Contains(r.Id))
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