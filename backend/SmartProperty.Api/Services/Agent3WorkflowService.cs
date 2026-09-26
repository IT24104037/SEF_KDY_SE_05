using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.Services;

public class Agent3WorkflowService
{
    private readonly AppDbContext _dbContext;
    private readonly TechnicianMatchingAgent _agent;
    private readonly ILogger<Agent3WorkflowService> _logger;

    public Agent3WorkflowService(
        AppDbContext dbContext,
        TechnicianMatchingAgent agent,
        ILogger<Agent3WorkflowService> logger)
    {
        _dbContext = dbContext;
        _agent = agent;
        _logger = logger;
    }

    public async Task<Agent3Result> ExecuteAsync(
        int workflowId,
        AnalysisOutput analysisOutput,
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
            .Include(r => r.Property)
            .FirstOrDefaultAsync(
                r => r.Id == workflow.MaintenanceRequestId,
                cancellationToken);

        if (request == null)
        {
            throw new KeyNotFoundException(
                $"Maintenance request {workflow.MaintenanceRequestId} was not found.");
        }

        var existingStep = workflow.WorkflowSteps
            .FirstOrDefault(x =>
                x.StepName == "Technician Matching & Scheduling");

        // Prevent Agent 3 from running twice.
        if (existingStep != null &&
            existingStep.Status == WorkflowStepStatus.Completed &&
            !string.IsNullOrWhiteSpace(existingStep.OutputSummary))
        {
            var existingOutput =
                JsonSerializer.Deserialize<Agent3Result>(
                    existingStep.OutputSummary);

            if (existingOutput != null)
            {
                return existingOutput;
            }
        }

        var now = DateTime.UtcNow;

        var step = existingStep ??
            new WorkflowStep
            {
                AgentWorkflowId = workflow.Id,
                StepOrder = 3,
                StepName = "Technician Matching & Scheduling",
                AgentName = "TechnicianMatchingAgent",
                Status = WorkflowStepStatus.Pending,
                CreatedAt = now
            };

        if (existingStep == null)
        {
            _dbContext.WorkflowSteps.Add(step);
        }

        var isEmergency =
            string.Equals(
                request.RequestType,
                "EMERGENCY",
                StringComparison.OrdinalIgnoreCase)
            ||
            string.Equals(
                analysisOutput.EmergencyClass,
                "LIFE_SAFETY_EMERGENCY",
                StringComparison.OrdinalIgnoreCase);

        step.Status = WorkflowStepStatus.Running;
        step.StartedAt = now;

        step.InputSummary =
            $"MaintenanceRequestId: {request.Id}; " +
            $"Category: {analysisOutput.Category}; " +
            $"RequiredSkill: {analysisOutput.RequiredSkill}; " +
            $"Priority: {analysisOutput.Priority}; " +
            $"Emergency: {isEmergency}";

        workflow.Status = AgentWorkflowStatus.Running;
        workflow.CurrentStep = "Technician Matching & Scheduling";
        workflow.UpdatedAt = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Resolve Agent 2 category to the database category ID.
            var categoryId = await ResolveCategoryIdAsync(
                analysisOutput,
                cancellationToken);

            var input = new Agent3Input
            {
                MaintenanceRequestId = request.Id,

                // CategoryId is the primary worker-matching method.
                CategoryId = categoryId,

                // RequiredSkill remains only as a fallback.
                RequiredSkill = analysisOutput.RequiredSkill,

                Priority = analysisOutput.Priority,
                Safety = analysisOutput.SafetyConcern,
                IsEmergency = isEmergency,
                PropertyCity = request.Property?.City,
                PropertyPostalCode = null,

                PropertyLatitude =
                    request.Property?.Latitude.HasValue == true
                        ? (double?)request.Property.Latitude.Value
                        : null,

                PropertyLongitude =
                    request.Property?.Longitude.HasValue == true
                        ? (double?)request.Property.Longitude.Value
                        : null,

                PreferredDateTime = null
            };

            var result = await _agent.ExecuteAsync(input);

            stopwatch.Stop();

            step.Status = WorkflowStepStatus.Completed;
            step.OutputSummary = JsonSerializer.Serialize(result);
            step.CompletedAt = DateTime.UtcNow;

            workflow.CurrentStep =
                "Agent 3 Complete - Pending Agent 4";
            workflow.UpdatedAt = DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName = "TechnicianMatchingAgent",
                Status = AgentExecutionStatus.Completed,
                Summary =
                    $"Agent 3 completed worker matching for maintenance request {request.Id}. Result: {result.Result}.",
                DurationMs = stopwatch.ElapsedMilliseconds,
                CreatedAt = DateTime.UtcNow,
                StartedAt = step.StartedAt ?? now,
                CompletedAt = DateTime.UtcNow
            };

            _dbContext.AgentExecutionLogs.Add(log);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return result;
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
                "Agent 3 failed for workflow {WorkflowId}",
                workflowId);

            step.Status = WorkflowStepStatus.Failed;
            step.ErrorSummary =
                "Agent 3 worker matching failed safely.";
            step.CompletedAt = DateTime.UtcNow;

            workflow.Status = AgentWorkflowStatus.Failed;
            workflow.CurrentStep = "Agent 3 Failed";
            workflow.FinalOutcome =
                "Worker matching could not be completed.";
            workflow.UpdatedAt = DateTime.UtcNow;

            var log = new AgentExecutionLog
            {
                AgentWorkflowId = workflow.Id,
                WorkflowStepId = step.Id,
                AgentName = "TechnicianMatchingAgent",
                Status = AgentExecutionStatus.Failed,
                Summary = "Agent 3 execution failed.",
                ErrorSummary =
                    "Agent 3 worker matching failed safely.",
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

    private async Task<int?> ResolveCategoryIdAsync(
        AnalysisOutput output,
        CancellationToken cancellationToken)
    {
        string? categoryName = output.Category?.ToUpperInvariant() switch
        {
            "SAFETY"
                when string.Equals(
                    output.RequiredSkill,
                    "Electrical",
                    StringComparison.OrdinalIgnoreCase)
                => "Electrical",

            "PLUMBING" => "Plumbing",
            "ELECTRICAL" => "Electrical",
            "STRUCTURAL" => "Structural / Building",
            "DOORS_WINDOWS_LOCKS" => "Doors / Windows / Locks",
            "DRAINAGE_WATER_DAMAGE" => "Drainage / Water Damage",
            "APPLIANCE" => "Other",
            "DAMAGE" => "Other",
            "OTHER" => "Other",
            _ => null
        };

        if (categoryName == null)
        {
            return null;
        }

        return await _dbContext.MaintenanceCategories
            .Where(x => x.Name == categoryName)
            .Select(x => (int?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}