using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.AgenticAI;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class AgentWorkflowService : IAgentWorkflowService
{
    private readonly AppDbContext _dbContext;
    private readonly PlannerCoordinatorAgent _plannerAgent;
    private readonly ILogger<AgentWorkflowService> _logger;

    public AgentWorkflowService(
        AppDbContext dbContext,
        PlannerCoordinatorAgent plannerAgent,
        ILogger<AgentWorkflowService> logger)
    {
        _dbContext = dbContext;
        _plannerAgent = plannerAgent;
        _logger = logger;
    }

    private async Task<bool> CanAccessMaintenanceRequestAsync(
        MaintenanceRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        if (currentUserRole == "Admin")
            return true;

        if (currentUserRole == "Tenant")
        {
            return await _dbContext.Tenants
                .AnyAsync(x => x.Id == request.TenantId && x.UserId == currentUserId, cancellationToken);
        }

        if (currentUserRole == "PropertyOwner")
        {
            var owner = await _dbContext.PropertyOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == currentUserId, cancellationToken);

            if (owner == null)
                return false;

            return await _dbContext.Properties
                .AnyAsync(x => x.Id == request.PropertyId && x.PropertyOwnerId == owner.Id, cancellationToken);
        }

        return false;
    }

    public async Task<WorkflowResponseDto> StartPlannerWorkflowAsync(
        int maintenanceRequestId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Initiating Agent 1 Planner workflow for maintenance request ID: {RequestId}", maintenanceRequestId);

        // A. Validate Maintenance Request exists
        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId, cancellationToken);

        if (request == null)
        {
            _logger.LogWarning("Maintenance request ID {RequestId} not found for workflow creation.", maintenanceRequestId);
            throw new KeyNotFoundException($"Maintenance request with ID {maintenanceRequestId} was not found.");
        }

        // B. Check user authorization
        if (!await CanAccessMaintenanceRequestAsync(request, currentUserId, currentUserRole, cancellationToken))
        {
            _logger.LogWarning("User ID {UserId} with role '{Role}' is not authorized for MaintenanceRequestId: {RequestId}", currentUserId, currentUserRole, maintenanceRequestId);
            throw new UnauthorizedAccessException("You are not authorized to access this maintenance request.");
        }

        // C. Check whether an active AgentWorkflow already exists for this maintenance request
        var existingWorkflow = await _dbContext.AgentWorkflows
            .Include(w => w.WorkflowSteps)
            .Include(w => w.ExecutionLogs)
            .FirstOrDefaultAsync(w => w.MaintenanceRequestId == maintenanceRequestId &&
                                     (w.Status == AgentWorkflowStatus.Pending || w.Status == AgentWorkflowStatus.Running),
                                 cancellationToken);

        if (existingWorkflow != null)
        {
            _logger.LogInformation("An active workflow (ID: {WorkflowId}) already exists for request ID {RequestId}. Returning existing workflow.", existingWorkflow.Id, maintenanceRequestId);
            return MapToWorkflowResponseDto(existingWorkflow);
        }

        // D. Create new AgentWorkflow record (durable state)
        var now = DateTime.UtcNow;
        var workflow = new AgentWorkflow
        {
            MaintenanceRequestId = maintenanceRequestId,
            Status = AgentWorkflowStatus.Running,
            CurrentStep = "Planner & Coordinator",
            ApprovalStatus = null,
            FinalOutcome = null,
            CreatedAt = now,
            StartedAt = now,
            UpdatedAt = now
        };

        _dbContext.AgentWorkflows.Add(workflow);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // E. Create initial WorkflowStep record (Step 1: Planner & Coordinator)
        var step = new WorkflowStep
        {
            AgentWorkflowId = workflow.Id,
            StepOrder = 1,
            StepName = "Planner & Coordinator",
            AgentName = "PlannerCoordinatorAgent",
            Status = WorkflowStepStatus.Running,
            InputSummary = $"MaintenanceRequestId: {maintenanceRequestId}",
            CreatedAt = now,
            StartedAt = now
        };

        _dbContext.WorkflowSteps.Add(step);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // F. Execute PlannerCoordinatorAgent
        var stopwatch = Stopwatch.StartNew();
        PlannerExecutionResult plannerResult;
        try
        {
            plannerResult = await _plannerAgent.CreatePlanAsync(maintenanceRequestId, cancellationToken);
            stopwatch.Stop();
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Workflow execution was canceled for request ID {RequestId}", maintenanceRequestId);
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error executing PlannerCoordinatorAgent for request ID {RequestId}", maintenanceRequestId);
            plannerResult = new PlannerExecutionResult
            {
                Output = new PlannerOutput
                {
                    MaintenanceRequestId = maintenanceRequestId,
                    IsSuccess = false,
                    ErrorMessage = "An unexpected error occurred during planning execution."
                }
            };
        }

        var plannerOutput = plannerResult.Output;
        var executionDurationMs = stopwatch.ElapsedMilliseconds;

        // G. Persist ToolExecutions
        if (plannerResult.ToolExecutions != null)
        {
            foreach (var toolMeta in plannerResult.ToolExecutions)
            {
                var toolExecution = new ToolExecution
                {
                    AgentWorkflowId = workflow.Id,
                    WorkflowStepId = step.Id,
                    ToolName = toolMeta.ToolName,
                    Status = toolMeta.Status,
                    InputSummary = toolMeta.InputSummary,
                    OutputSummary = toolMeta.OutputSummary,
                    ErrorSummary = toolMeta.ErrorSummary,
                    RetryCount = toolMeta.RetryCount,
                    DurationMs = toolMeta.DurationMs,
                    CreatedAt = toolMeta.StartedAt,
                    StartedAt = toolMeta.StartedAt,
                    CompletedAt = toolMeta.CompletedAt
                };
                _dbContext.ToolExecutions.Add(toolExecution);
            }
        }

        // H. Persist AgentExecutionLog
        var executionLog = new AgentExecutionLog
        {
            AgentWorkflowId = workflow.Id,
            WorkflowStepId = step.Id,
            AgentName = "PlannerCoordinatorAgent",
            Status = plannerOutput.IsSuccess ? AgentExecutionStatus.Completed : AgentExecutionStatus.Failed,
            Summary = plannerOutput.IsSuccess ? plannerOutput.Summary : "Planner execution failed.",
            ErrorSummary = plannerOutput.IsSuccess ? null : plannerOutput.ErrorMessage,
            DurationMs = executionDurationMs,
            CreatedAt = DateTime.UtcNow,
            StartedAt = step.StartedAt ?? now,
            CompletedAt = DateTime.UtcNow
        };

        _dbContext.AgentExecutionLogs.Add(executionLog);

        // H. Update WorkflowStep
        if (plannerOutput.IsSuccess)
        {
            step.Status = WorkflowStepStatus.Completed;
            step.OutputSummary = JsonSerializer.Serialize(plannerOutput);
            step.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            step.Status = WorkflowStepStatus.Failed;
            step.ErrorSummary = plannerOutput.ErrorMessage ?? "Planner execution failed.";
            step.CompletedAt = DateTime.UtcNow;
        }

        // I. Update AgentWorkflow
        if (plannerOutput.IsSuccess)
        {
            // Workflow remains Running for downstream Agent 2/3/4 hand-off
            workflow.Status = AgentWorkflowStatus.Running;
            workflow.CurrentStep = "Agent 1 Complete - Pending Downstream Analysis";
            workflow.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            workflow.Status = AgentWorkflowStatus.Failed;
            workflow.CurrentStep = "Planner Failed";
            workflow.FinalOutcome = plannerOutput.ErrorMessage ?? "Planner execution failed.";
            workflow.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // J. Fetch updated graph for DTO response
        var resultWorkflow = await _dbContext.AgentWorkflows
            .AsNoTracking()
            .Include(w => w.WorkflowSteps)
            .Include(w => w.ExecutionLogs)
            .FirstAsync(w => w.Id == workflow.Id, cancellationToken);

        var responseDto = MapToWorkflowResponseDto(resultWorkflow);
        if (plannerOutput.IsSuccess)
        {
            responseDto.PlannerOutput = plannerOutput;
        }

        return responseDto;
    }

    public async Task<WorkflowResponseDto?> GetWorkflowByIdAsync(
        int workflowId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _dbContext.AgentWorkflows
            .AsNoTracking()
            .Include(w => w.WorkflowSteps)
            .Include(w => w.ExecutionLogs)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken);

        if (workflow == null)
            return null;

        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == workflow.MaintenanceRequestId, cancellationToken);

        if (request == null || !await CanAccessMaintenanceRequestAsync(request, currentUserId, currentUserRole, cancellationToken))
        {
            throw new UnauthorizedAccessException("You are not authorized to access this workflow.");
        }

        return MapToWorkflowResponseDto(workflow);
    }

    public async Task<WorkflowResponseDto?> GetWorkflowByRequestIdAsync(
        int maintenanceRequestId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId, cancellationToken);

        if (request == null)
            return null;

        if (!await CanAccessMaintenanceRequestAsync(request, currentUserId, currentUserRole, cancellationToken))
        {
            throw new UnauthorizedAccessException("You are not authorized to access this maintenance request.");
        }

        var workflow = await _dbContext.AgentWorkflows
            .AsNoTracking()
            .Include(w => w.WorkflowSteps)
            .Include(w => w.ExecutionLogs)
            .OrderByDescending(w => w.CreatedAt)
            .FirstOrDefaultAsync(w => w.MaintenanceRequestId == maintenanceRequestId, cancellationToken);

        if (workflow == null)
            return null;

        return MapToWorkflowResponseDto(workflow);
    }

    public async Task<List<AgentExecutionLogDto>?> GetWorkflowLogsAsync(
        int workflowId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _dbContext.AgentWorkflows
            .AsNoTracking()
            .Include(w => w.ExecutionLogs)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken);

        if (workflow == null)
            return null;

        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == workflow.MaintenanceRequestId, cancellationToken);

        if (request == null || !await CanAccessMaintenanceRequestAsync(request, currentUserId, currentUserRole, cancellationToken))
        {
            throw new UnauthorizedAccessException("You are not authorized to access logs for this workflow.");
        }

        return workflow.ExecutionLogs
            .OrderBy(l => l.CreatedAt)
            .Select(l => new AgentExecutionLogDto
            {
                Id = l.Id,
                AgentName = l.AgentName,
                Status = l.Status.ToString(),
                Summary = l.Summary,
                ErrorSummary = l.ErrorSummary,
                DurationMs = l.DurationMs,
                StartedAt = l.StartedAt,
                CompletedAt = l.CompletedAt
            }).ToList();
    }

    private static WorkflowResponseDto MapToWorkflowResponseDto(AgentWorkflow workflow)
    {
        PlannerOutput? plannerOutput = null;

        var firstStep = workflow.WorkflowSteps.FirstOrDefault(s => s.StepName == "Planner & Coordinator");
        if (firstStep != null && !string.IsNullOrWhiteSpace(firstStep.OutputSummary))
        {
            try
            {
                plannerOutput = JsonSerializer.Deserialize<PlannerOutput>(firstStep.OutputSummary);
            }
            catch
            {
                // Summary was non-JSON or format changed
            }
        }

        return new WorkflowResponseDto
        {
            Id = workflow.Id,
            MaintenanceRequestId = workflow.MaintenanceRequestId,
            Status = workflow.Status.ToString(),
            CurrentStep = workflow.CurrentStep,
            ApprovalStatus = workflow.ApprovalStatus,
            FinalOutcome = workflow.FinalOutcome,
            CreatedAt = workflow.CreatedAt,
            StartedAt = workflow.StartedAt,
            CompletedAt = workflow.CompletedAt,
            UpdatedAt = workflow.UpdatedAt,
            PlannerOutput = plannerOutput,
            Steps = workflow.WorkflowSteps.OrderBy(s => s.StepOrder).Select(s => new WorkflowStepDto
            {
                Id = s.Id,
                StepOrder = s.StepOrder,
                StepName = s.StepName,
                AgentName = s.AgentName,
                Status = s.Status.ToString(),
                InputSummary = s.InputSummary,
                OutputSummary = s.OutputSummary,
                ErrorSummary = s.ErrorSummary,
                CreatedAt = s.CreatedAt,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt
            }).ToList(),
            ExecutionLogs = workflow.ExecutionLogs.OrderBy(l => l.CreatedAt).Select(l => new AgentExecutionLogDto
            {
                Id = l.Id,
                AgentName = l.AgentName,
                Status = l.Status.ToString(),
                Summary = l.Summary,
                ErrorSummary = l.ErrorSummary,
                DurationMs = l.DurationMs,
                StartedAt = l.StartedAt,
                CompletedAt = l.CompletedAt
            }).ToList()
        };
    }
}
