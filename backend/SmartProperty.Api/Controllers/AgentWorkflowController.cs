using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.AgenticAI;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/agent-workflows")]
[Authorize]
public class AgentWorkflowController : ControllerBase
{
    private readonly IAgentWorkflowService _workflowService;
    private readonly ILogger<AgentWorkflowController> _logger;

    public AgentWorkflowController(
        IAgentWorkflowService workflowService,
        ILogger<AgentWorkflowController> logger)
    {
        _workflowService = workflowService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/agent-workflows/start
    /// Starts Agent 1 Planner & Coordinator workflow for a maintenance request.
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartWorkflow([FromBody] StartWorkflowDto dto, CancellationToken cancellationToken)
    {
        if (dto == null || dto.MaintenanceRequestId <= 0)
        {
            return BadRequest(new { message = "A valid positive MaintenanceRequestId is required." });
        }

        try
        {
            var result = await _workflowService.StartPlannerWorkflowAsync(dto.MaintenanceRequestId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start workflow for MaintenanceRequestId: {RequestId}", dto.MaintenanceRequestId);
            return StatusCode(500, new { message = "An unexpected error occurred while starting the workflow." });
        }
    }

    /// <summary>
    /// GET /api/agent-workflows/{id}
    /// Retrieves an AgentWorkflow by workflow ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "A valid positive workflow ID is required." });
        }

        var workflow = await _workflowService.GetWorkflowByIdAsync(id, cancellationToken);
        if (workflow == null)
        {
            return NotFound(new { message = $"AgentWorkflow with ID {id} was not found." });
        }

        return Ok(workflow);
    }

    /// <summary>
    /// GET /api/agent-workflows/request/{maintenanceRequestId}
    /// Retrieves the AgentWorkflow associated with a maintenance request.
    /// </summary>
    [HttpGet("request/{maintenanceRequestId:int}")]
    public async Task<IActionResult> GetByRequestId(int maintenanceRequestId, CancellationToken cancellationToken)
    {
        if (maintenanceRequestId <= 0)
        {
            return BadRequest(new { message = "A valid positive MaintenanceRequestId is required." });
        }

        var workflow = await _workflowService.GetWorkflowByRequestIdAsync(maintenanceRequestId, cancellationToken);
        if (workflow == null)
        {
            return NotFound(new { message = $"No AgentWorkflow found for MaintenanceRequest ID {maintenanceRequestId}." });
        }

        return Ok(workflow);
    }

    /// <summary>
    /// GET /api/agent-workflows/{id}/logs
    /// Retrieves execution logs for an AgentWorkflow by workflow ID.
    /// </summary>
    [HttpGet("{id:int}/logs")]
    public async Task<IActionResult> GetLogs(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "A valid positive workflow ID is required." });
        }

        var logs = await _workflowService.GetWorkflowLogsAsync(id, cancellationToken);
        if (logs == null)
        {
            return NotFound(new { message = $"AgentWorkflow with ID {id} was not found." });
        }

        return Ok(logs);
    }
}
