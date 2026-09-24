using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/agent3")]
[Authorize]
public class Agent3Controller : ControllerBase
{
    private readonly TechnicianMatchingAgent _agent;

    public Agent3Controller(TechnicianMatchingAgent agent)
    {
        _agent = agent;
    }

    [HttpPost("match")]
    public async Task<ActionResult<Agent3Result>> Match(
        [FromBody] Agent3Input input)
    {
        if (input.MaintenanceRequestId <= 0)
        {
            return BadRequest(new
            {
                message = "A valid maintenance request ID is required."
            });
        }

        if (!input.CategoryId.HasValue &&
            string.IsNullOrWhiteSpace(input.RequiredSkill))
        {
            return BadRequest(new
            {
                message =
                    "CategoryId or RequiredSkill is required for worker matching."
            });
        }

        try
        {
            var result = await _agent.ExecuteAsync(input);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Agent 3 worker matching failed.",
                    error = ex.Message
                });
        }
    }
}