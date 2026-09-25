using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.Services;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/agent2/workflow")]
[Authorize]
public class Agent2WorkflowController : ControllerBase
{
    private readonly Agent2WorkflowService _service;

    public Agent2WorkflowController(
        Agent2WorkflowService service)
    {
        _service = service;
    }

    [HttpPost("{workflowId:int}/execute")]
    public async Task<IActionResult> Execute(
        int workflowId,
        CancellationToken cancellationToken)
    {
        if (workflowId <= 0)
        {
            return BadRequest(new
            {
                message = "A valid workflow ID is required."
            });
        }

        try
        {
            var result =
                await _service.ExecuteAsync(
                    workflowId,
                    cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new
            {
                message = ex.Message
            });
        }
    }
}