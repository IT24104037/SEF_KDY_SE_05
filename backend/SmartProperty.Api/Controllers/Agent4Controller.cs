using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.AgenticAI;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Services;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/agent4")]
[Authorize]
public class Agent4Controller : ControllerBase
{
    private readonly ValidationSafetyAgent _agent;
    private readonly Agent4WorkflowService _workflowService;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<Agent4Controller> _logger;

    public Agent4Controller(
        ValidationSafetyAgent agent,
        Agent4WorkflowService workflowService,
        AppDbContext dbContext,
        ILogger<Agent4Controller> logger)
    {
        _agent = agent;
        _workflowService = workflowService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Executes Agent 4 compliance and safety validation for an existing workflow.
    /// Reads Step 2 (Analysis) and Step 3 (Matching) outputs to perform pre-approval audit.
    /// </summary>
    [HttpPost("workflow/{workflowId:int}/validate")]
    public async Task<IActionResult> ValidateWorkflow(
        int workflowId,
        CancellationToken cancellationToken)
    {
        if (workflowId <= 0)
        {
            return BadRequest(new { message = "A valid workflow ID is required." });
        }

        var workflow = await _dbContext.AgentWorkflows
            .Include(w => w.WorkflowSteps)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken);

        if (workflow == null)
        {
            return NotFound(new { message = $"Workflow {workflowId} was not found." });
        }

        var step2 = workflow.WorkflowSteps
            .FirstOrDefault(s => s.StepName == "Issue Analysis & Category Prediction");
        var step3 = workflow.WorkflowSteps
            .FirstOrDefault(s => s.StepName == "Technician Matching & Scheduling");

        if (step3 == null || string.IsNullOrWhiteSpace(step3.OutputSummary))
        {
            return BadRequest(new { message = "Agent 3 worker matching has not completed for this workflow." });
        }

        Agent3Result? matchResult;
        try
        {
            matchResult = JsonSerializer.Deserialize<Agent3Result>(step3.OutputSummary);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Failed to deserialize Agent 3 match output.", error = ex.Message });
        }

        if (matchResult == null)
        {
            return BadRequest(new { message = "Agent 3 result was empty." });
        }

        AnalysisOutput analysisOutput;
        if (step2 != null && !string.IsNullOrWhiteSpace(step2.OutputSummary))
        {
            try
            {
                analysisOutput = JsonSerializer.Deserialize<AnalysisOutput>(step2.OutputSummary)
                    ?? new AnalysisOutput();
            }
            catch
            {
                analysisOutput = new AnalysisOutput();
            }
        }
        else
        {
            analysisOutput = new AnalysisOutput();
        }

        try
        {
            var output = await _workflowService.ExecuteAsync(
                workflowId,
                analysisOutput,
                matchResult,
                cancellationToken);

            return Ok(output);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Agent 4 validation failed for workflow {WorkflowId}", workflowId);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Agent 4 validation encountered an unexpected error.",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Executes on-demand validation of a technician for a maintenance request.
    /// Runs all 6 deterministic pillars (credentials, trade match, geo-fencing, availability, safety, rate benchmarking).
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateWorker(
        [FromBody] Agent4ValidateWorkerRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.MaintenanceRequestId <= 0 || dto.WorkerId <= 0)
        {
            return BadRequest(new { message = "Valid MaintenanceRequestId and WorkerId are required." });
        }

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = dto.MaintenanceRequestId,
            WorkerId = dto.WorkerId,
            SuggestedDateTime = dto.SuggestedDateTime ?? DateTime.UtcNow.AddDays(1),
            IsEmergency = dto.IsEmergency,
            Result = "ManualValidation"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = dto.Category ?? string.Empty,
            RequiredSkill = dto.RequiredSkill ?? string.Empty,
            Priority = dto.Priority ?? (dto.IsEmergency ? "EMERGENCY" : "NORMAL"),
            SafetyConcern = dto.SafetyConcern ?? "NONE",
            EmergencyClass = dto.IsEmergency ? "LIFE_SAFETY_EMERGENCY" : "NON_EMERGENCY"
        };

        try
        {
            var output = await _agent.ExecuteAsync(
                matchResult,
                analysisOutput,
                dto.MaintenanceRequestId,
                0,
                cancellationToken);

            return Ok(output);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Agent 4 on-demand validation failed for Request {RequestId}, Worker {WorkerId}",
                dto.MaintenanceRequestId, dto.WorkerId);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Agent 4 validation failed.",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Retrieves the persisted ValidationResult and full Agent 4 memory snapshot for a maintenance request.
    /// </summary>
    [HttpGet("validation-result/{maintenanceRequestId:int}")]
    public async Task<IActionResult> GetValidationResult(
        int maintenanceRequestId,
        CancellationToken cancellationToken)
    {
        if (maintenanceRequestId <= 0)
        {
            return BadRequest(new { message = "A valid maintenance request ID is required." });
        }

        var result = await _dbContext.ValidationResults
            .Include(v => v.Worker)
                .ThenInclude(w => w!.User)
            .FirstOrDefaultAsync(v => v.MaintenanceRequestId == maintenanceRequestId, cancellationToken);

        if (result == null)
        {
            return NotFound(new
            {
                message = $"No validation result found for maintenance request {maintenanceRequestId}."
            });
        }

        object? memoryObj = null;
        if (!string.IsNullOrWhiteSpace(result.DetailsJson))
        {
            try
            {
                memoryObj = JsonSerializer.Deserialize<Agent4Memory>(result.DetailsJson);
            }
            catch
            {
                // Fallback to raw string if custom format
                memoryObj = result.DetailsJson;
            }
        }

        var memory = memoryObj as Agent4Memory;

        var response = new Agent4ValidationDetailResponseDto
        {
            Id = result.Id,
            MaintenanceRequestId = result.MaintenanceRequestId,
            WorkerId = result.WorkerId,
            WorkerName = result.Worker?.User?.FullName ?? (result.WorkerId.HasValue ? $"Worker #{result.WorkerId}" : "Unassigned"),
            Status = result.Status.ToString(),
            Summary = result.Summary,
            RiskScore = memory?.RiskScore ?? 0.0,
            ConfidenceScore = memory?.ConfidenceScore ?? 1.0,
            PassedRules = memory?.ValidationPassedChecks ?? new List<string>(),
            Warnings = memory?.WarningFlags ?? new List<string>(),
            Violations = memory?.BlockingFailures ?? new List<string>(),
            RecommendedAction = memory?.RecommendationsForOwner,
            MemoryDetails = memoryObj,
            ValidatedAt = result.ValidatedAt
        };

        return Ok(response);
    }
}
