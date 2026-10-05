using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.Services;

public class Agent2WorkflowService
{
    private readonly AppDbContext _dbContext;
    private readonly Agent2MaintenanceAnalysisService _analysisService;

    private readonly Agent3WorkflowService _agent3WorkflowService;
    private readonly ILogger<Agent2WorkflowService> _logger;

    public Agent2WorkflowService(
        AppDbContext dbContext,
        Agent2MaintenanceAnalysisService analysisService,
        Agent3WorkflowService agent3WorkflowService,
        ILogger<Agent2WorkflowService> logger)
    {
        _dbContext = dbContext;
        _analysisService = analysisService;
        _agent3WorkflowService = agent3WorkflowService;
        _logger = logger;
    }

    public async Task<AnalysisOutput> ExecuteAsync(
        int workflowId,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _dbContext.AgentWorkflows
            .Include(w => w.WorkflowSteps)
            .FirstOrDefaultAsync(
                w => w.Id == workflowId,
                cancellationToken);

        if (workflow == null)
        {
            throw new KeyNotFoundException(
                $"Agent workflow {workflowId} was not found.");
        }

        var request = await _dbContext.MaintenanceRequests
            .Include(r => r.Category)
            .FirstOrDefaultAsync(
                r => r.Id == workflow.MaintenanceRequestId,
                cancellationToken);

        if (request == null)
        {
            throw new KeyNotFoundException(
                $"Maintenance request {workflow.MaintenanceRequestId} was not found.");
        }

        var images = await _dbContext.MaintenanceImages
            .AsNoTracking()
            .Where(x =>
                x.MaintenanceRequestId ==
                request.Id)
            .Select(x => x.ImageUrl)
            .ToListAsync(cancellationToken);

        var existingStep = workflow.WorkflowSteps
            .FirstOrDefault(x =>
                x.StepName ==
                "Visual Analysis & Responsibility");

        if (existingStep != null &&
            existingStep.Status ==
            WorkflowStepStatus.Completed)
        {
            if (!string.IsNullOrWhiteSpace(
                existingStep.OutputSummary))
            {
                var existingOutput =
                    JsonSerializer.Deserialize<AnalysisOutput>(
                        existingStep.OutputSummary);

                if (existingOutput != null)
                {
                    await TryRunAgent3Async(
                        workflow.Id,
                        existingOutput,
                        cancellationToken);

                    return existingOutput;
                }
            }
        }

        var now = DateTime.UtcNow;

        var step = existingStep ??
            new WorkflowStep
            {
                AgentWorkflowId = workflow.Id,
                StepOrder = 2,
                StepName =
                    "Visual Analysis & Responsibility",
                AgentName =
                    "MaintenanceAnalysisAgent",
                Status =
                    WorkflowStepStatus.Pending,
                CreatedAt = now
            };

        if (existingStep == null)
        {
            _dbContext.WorkflowSteps.Add(step);
        }

        step.Status = WorkflowStepStatus.Running;
        step.StartedAt = now;
        step.InputSummary =
            $"MaintenanceRequestId: {request.Id}; Images: {images.Count}";

        workflow.Status = AgentWorkflowStatus.Running;
        workflow.CurrentStep =
            "Visual Analysis & Responsibility";
        workflow.UpdatedAt = now;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var input = new AnalysisInput
            {
                MaintenanceRequestId = request.Id,
                Description = request.Description,
                RequestType = request.RequestType,
                EmergencyType = request.EmergencyType,
                PropertyId = request.PropertyId,
                UnitId = request.UnitId,
                ImageUrls = images
            };

            var output =
                await _analysisService.AnalyzeAsync(
                    input,
                    cancellationToken);

            stopwatch.Stop();

            step.Status =
                WorkflowStepStatus.Completed;

            step.OutputSummary =
                JsonSerializer.Serialize(output);

            step.CompletedAt =
                DateTime.UtcNow;

            workflow.CurrentStep =
                "Agent 2 Complete - Pending Agent 3";

            workflow.UpdatedAt =
                DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName =
                    "MaintenanceAnalysisAgent",
                Status =
                    AgentExecutionStatus.Completed,
                Summary =
                    $"Agent 2 completed analysis for maintenance request {request.Id}.",
                DurationMs =
                    stopwatch.ElapsedMilliseconds,
                CreatedAt =
                    DateTime.UtcNow,
                StartedAt =
                    step.StartedAt ?? now,
                CompletedAt =
                    DateTime.UtcNow
            };

            _dbContext.AgentExecutionLogs.Add(log);

            await _dbContext.SaveChangesAsync(
                CancellationToken.None);

            // Automatically continue from Agent 2 to Agent 3.
            await TryRunAgent3Async(
                workflow.Id,
                output,
                CancellationToken.None);

            return output;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Agent 2 failed for workflow {WorkflowId}",
                workflowId);

            step.Status =
                WorkflowStepStatus.Failed;

            step.ErrorSummary =
                "Agent 2 analysis failed safely.";

            step.CompletedAt =
                DateTime.UtcNow;

            workflow.Status =
                AgentWorkflowStatus.Failed;

            workflow.CurrentStep =
                "Agent 2 Failed";

            workflow.FinalOutcome =
                "Agent 2 analysis could not be completed.";

            workflow.UpdatedAt =
                DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName =
                    "MaintenanceAnalysisAgent",
                Status =
                    AgentExecutionStatus.Failed,
                Summary =
                    "Agent 2 execution failed.",
                ErrorSummary =
                    "Agent 2 analysis failed safely.",
                DurationMs =
                    stopwatch.ElapsedMilliseconds,
                CreatedAt =
                    DateTime.UtcNow,
                StartedAt =
                    step.StartedAt ?? now,
                CompletedAt =
                    DateTime.UtcNow
            };

            _dbContext.AgentExecutionLogs.Add(log);

            await _dbContext.SaveChangesAsync(
                cancellationToken);

            throw;
        }
    }

    private async Task TryRunAgent3Async(
    int workflowId,
    AnalysisOutput output,
    CancellationToken cancellationToken)
{

// ---------------------------------------------------------
// FIRE / IMMEDIATE LIFE-SAFETY EMERGENCY
// No maintenance worker must be assigned.
// ---------------------------------------------------------
var emergencyServicesRequired =
    string.Equals(
        output.EmergencyClass,
        "LIFE_SAFETY_EMERGENCY",
        StringComparison.OrdinalIgnoreCase);

if (emergencyServicesRequired)
{
    var workflow = await _dbContext.AgentWorkflows
        .Include(w => w.WorkflowSteps)
        .FirstAsync(
            w => w.Id == workflowId,
            cancellationToken);

    var now = DateTime.UtcNow;

    var request = await _dbContext.MaintenanceRequests
        .FirstOrDefaultAsync(
            r => r.Id == workflow.MaintenanceRequestId,
            cancellationToken);

    if (request != null)
    {
        var oldStatus = request.Status;

        request.Status = "Emergency";
        request.Priority = "Critical";
        request.UpdatedAt = now;

        if (!string.Equals(
                oldStatus,
                "Emergency",
                StringComparison.OrdinalIgnoreCase))
        {
            _dbContext.MaintenanceStatusHistories.Add(
                new MaintenanceStatusHistory
                {
                    MaintenanceRequestId = request.Id,
                    OldStatus = oldStatus,
                    NewStatus = "Emergency",
                    ChangedByUserId = null,
                    Note =
                        "Agent 2 detected a fire/life-safety emergency. Immediate emergency services are required.",
                    ChangedAt = now
                });
        }
    }

    // Agent 3 must not run for active fire.
    if (!workflow.WorkflowSteps.Any(
            x => x.StepOrder == 3))
    {
        _dbContext.WorkflowSteps.Add(
            new WorkflowStep
            {
                AgentWorkflowId = workflowId,
                StepOrder = 3,
                StepName =
                    "Technician Matching & Scheduling",
                AgentName =
                    "TechnicianMatchingAgent",
                Status =
                    WorkflowStepStatus.Skipped,
                ErrorSummary =
                    "Skipped because immediate emergency services are required.",
                CreatedAt = now,
                CompletedAt = now
            });
    }

    // Agent 4 also does not need to validate a worker
    // because no worker is being assigned.
    if (!workflow.WorkflowSteps.Any(
            x => x.StepOrder == 4))
    {
        _dbContext.WorkflowSteps.Add(
            new WorkflowStep
            {
                AgentWorkflowId = workflowId,
                StepOrder = 4,
                StepName =
                    "Safety & Compliance Validation",
                AgentName =
                    "ValidationSafetyAgent",
                Status =
                    WorkflowStepStatus.Skipped,
                ErrorSummary =
                    "Skipped because immediate emergency services are required.",
                CreatedAt = now,
                CompletedAt = now
            });
    }

    workflow.Status =
        AgentWorkflowStatus.Completed;

    workflow.CurrentStep =
        "Emergency Services Required";

    workflow.ApprovalStatus =
        "EmergencyServicesRequired";

    workflow.FinalOutcome =
        output.SafetyConcern ??
        "Immediate life-safety emergency detected. Contact emergency services. No maintenance worker was assigned.";

    workflow.CompletedAt = now;
    workflow.UpdatedAt = now;

    await _dbContext.SaveChangesAsync(
        CancellationToken.None);

    return;
}
  
    // Do not assign a worker when Agent 2 needs more information
    // or cannot identify an actionable category.
  if (output.NeedsMoreInformation ||
        string.Equals(
            output.Category,
            "UNKNOWN",
            StringComparison.OrdinalIgnoreCase))
{
    var workflow = await _dbContext.AgentWorkflows
        .Include(w => w.WorkflowSteps)
        .FirstAsync(
            w => w.Id == workflowId,
            cancellationToken);

    var now = DateTime.UtcNow;

    if (!workflow.WorkflowSteps.Any(x =>
            x.StepOrder == 3))
    {
        _dbContext.WorkflowSteps.Add(
            new WorkflowStep
            {
                AgentWorkflowId = workflowId,
                StepOrder = 3,
                StepName =
                    "Technician Matching & Scheduling",
                AgentName =
                    "TechnicianMatchingAgent",
                Status =
                    WorkflowStepStatus.Skipped,
                ErrorSummary =
                    "Skipped because Agent 2 requires more information.",
                CreatedAt = now,
                CompletedAt = now
            });
    }

    if (!workflow.WorkflowSteps.Any(x =>
            x.StepOrder == 4))
    {
        _dbContext.WorkflowSteps.Add(
            new WorkflowStep
            {
                AgentWorkflowId = workflowId,
                StepOrder = 4,
                StepName =
                    "Safety & Compliance Validation",
                AgentName =
                    "ValidationSafetyAgent",
                Status =
                    WorkflowStepStatus.Skipped,
                ErrorSummary =
                    "Skipped because no worker could be matched.",
                CreatedAt = now,
                CompletedAt = now
            });
    }

    workflow.Status =
        AgentWorkflowStatus.Completed;

    workflow.CurrentStep =
        "Stopped - More Information Required";

    workflow.ApprovalStatus =
        "NeedsMoreInformation";

    workflow.FinalOutcome =
        "Agent 2 could not safely classify the request. No worker was assigned.";

    workflow.CompletedAt = now;
    workflow.UpdatedAt = now;

    await _dbContext.SaveChangesAsync(
        cancellationToken);

    return;
}

    try
    {
        await _agent3WorkflowService.ExecuteAsync(
            workflowId,
            output,
            CancellationToken.None);
    }
    catch (OperationCanceledException)
    {
        throw;
    }
    catch (Exception ex)
    {
        _logger.LogError(
            ex,
            "Automatic Agent 2 to Agent 3 handoff failed for workflow {WorkflowId}",
            workflowId);
    }
}
}