using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.Services;

public class Agent2WorkflowService
{
    private readonly AppDbContext _dbContext;
    private readonly Agent2MaintenanceAnalysisService _analysisService;
    private readonly ILogger<Agent2WorkflowService> _logger;

    public Agent2WorkflowService(
        AppDbContext dbContext,
        Agent2MaintenanceAnalysisService analysisService,
        ILogger<Agent2WorkflowService> logger)
    {
        _dbContext = dbContext;
        _analysisService = analysisService;
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
                    return existingOutput;
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
                cancellationToken);

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
}