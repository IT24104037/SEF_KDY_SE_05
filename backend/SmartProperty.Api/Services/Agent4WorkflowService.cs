using System;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.Services;

/// <summary>
/// Workflow service for Agent 4 (Validation & Safety Agent).
/// Orchestrates Step 4 of the Agentic AI pipeline: performs pre-approval compliance audit,
/// persists ValidationResult, and updates workflow approval readiness.
/// </summary>
public class Agent4WorkflowService
{
    private readonly AppDbContext _dbContext;
    private readonly ValidationSafetyAgent _agent;
    private readonly ILogger<Agent4WorkflowService> _logger;

    public Agent4WorkflowService(
        AppDbContext dbContext,
        ValidationSafetyAgent agent,
        ILogger<Agent4WorkflowService> logger)
    {
        _dbContext = dbContext;
        _agent = agent;
        _logger = logger;
    }

    /// <summary>
    /// Executes the Agent 4 validation step within the context of an AgentWorkflow.
    /// </summary>
    public async Task<ValidationOutput> ExecuteAsync(
        int workflowId,
        AnalysisOutput analysisOutput,
        Agent3Result matchResult,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _dbContext.AgentWorkflows
            .Include(w => w.WorkflowSteps)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken);

        if (workflow == null)
        {
            throw new KeyNotFoundException($"Agent workflow {workflowId} was not found.");
        }

        var request = await _dbContext.MaintenanceRequests
            .Include(r => r.Property)
            .FirstOrDefaultAsync(r => r.Id == workflow.MaintenanceRequestId, cancellationToken);

        if (request == null)
        {
            throw new KeyNotFoundException($"Maintenance request {workflow.MaintenanceRequestId} was not found.");
        }

        var existingStep = workflow.WorkflowSteps
            .FirstOrDefault(x => x.StepName == "Safety & Compliance Validation");

        // Idempotency: avoid re-running if already completed
        if (existingStep != null &&
            existingStep.Status == WorkflowStepStatus.Completed &&
            !string.IsNullOrWhiteSpace(existingStep.OutputSummary))
        {
            var cached = JsonSerializer.Deserialize<ValidationOutput>(existingStep.OutputSummary);
            if (cached != null)
            {
                return cached;
            }
        }

        var now = DateTime.UtcNow;
        var step = existingStep ?? new WorkflowStep
        {
            AgentWorkflowId = workflow.Id,
            StepOrder = 4,
            StepName = "Safety & Compliance Validation",
            AgentName = "ValidationSafetyAgent",
            Status = WorkflowStepStatus.Pending,
            CreatedAt = now
        };

        if (existingStep == null)
        {
            _dbContext.WorkflowSteps.Add(step);
        }

        step.Status = WorkflowStepStatus.Running;
        step.StartedAt = now;
        step.InputSummary = $"WorkerId: {matchResult.WorkerId}; Category: {analysisOutput.Category}; Priority: {analysisOutput.Priority}; Emergency: {matchResult.IsEmergency}";

        workflow.Status = AgentWorkflowStatus.Running;
        workflow.CurrentStep = "Safety & Compliance Validation";
        workflow.UpdatedAt = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var output = await _agent.ExecuteAsync(
                matchResult,
                analysisOutput,
                request.Id,
                workflow.Id,
                cancellationToken);

            stopwatch.Stop();

            step.Status = WorkflowStepStatus.Completed;
            step.OutputSummary = JsonSerializer.Serialize(output);
            step.CompletedAt = DateTime.UtcNow;

            // Route workflow outcome based on Agent 4 validation status
            switch (output.Status)
            {
                case ValidationStatus.Pass:
                    workflow.Status = AgentWorkflowStatus.Completed;
                    workflow.CurrentStep = "Validation Passed - Ready for Owner Approval";
                    workflow.ApprovalStatus = "PendingOwnerApproval";
                    workflow.FinalOutcome = output.Summary;
                    break;

                case ValidationStatus.RevisionRequired:
                    workflow.Status = AgentWorkflowStatus.Running;
                    workflow.CurrentStep = "Validation Revision Required - Technician Re-matching Recommended";
                    workflow.ApprovalStatus = "RevisionRequired";
                    workflow.FinalOutcome = output.Summary;
                    break;

                case ValidationStatus.Fail:
                default:
                    workflow.Status = AgentWorkflowStatus.Failed;
                    workflow.CurrentStep = "Validation Failed - External Maintenance Required";
                    workflow.ApprovalStatus = "ExternalMaintenanceRequired";
                    workflow.FinalOutcome = output.Summary;
                    break;
            }

            workflow.UpdatedAt = DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName = "ValidationSafetyAgent",
                Status = AgentExecutionStatus.Completed,
                Summary = $"Agent 4 completed validation for request {request.Id}. Status: {output.Status}. RiskScore: {output.RiskScore:F1}.",
                DurationMs = stopwatch.ElapsedMilliseconds,
                CreatedAt = DateTime.UtcNow,
                StartedAt = step.StartedAt ?? now,
                CompletedAt = DateTime.UtcNow
            };

            _dbContext.AgentExecutionLogs.Add(log);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return output;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "Agent 4 validation failed for workflow {WorkflowId}", workflowId);

            step.Status = WorkflowStepStatus.Failed;
            step.ErrorSummary = "Agent 4 validation failed safely.";
            step.CompletedAt = DateTime.UtcNow;

            workflow.Status = AgentWorkflowStatus.Failed;
            workflow.CurrentStep = "Agent 4 Failed";
            workflow.FinalOutcome = "Safety and compliance validation failed.";
            workflow.UpdatedAt = DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName = "ValidationSafetyAgent",
                Status = AgentExecutionStatus.Failed,
                Summary = "Agent 4 execution failed.",
                ErrorSummary = ex.Message,
                DurationMs = stopwatch.ElapsedMilliseconds,
                CreatedAt = DateTime.UtcNow,
                StartedAt = step.StartedAt ?? now,
                CompletedAt = DateTime.UtcNow
            };

            _dbContext.AgentExecutionLogs.Add(log);

            await _dbContext.SaveChangesAsync(cancellationToken);

            throw;
        }
    }
}
