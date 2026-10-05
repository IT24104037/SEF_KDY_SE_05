using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Services;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/agent2")]
[Authorize]
public class Agent2MaintenanceAnalysisController : ControllerBase
{
    private readonly Agent2MaintenanceAnalysisService _service;

    public Agent2MaintenanceAnalysisController(
        Agent2MaintenanceAnalysisService service)
    {
        _service = service;
    }

    [HttpPost("maintenance-analysis")]
    public async Task<IActionResult> Analyze(
        [FromBody] AnalysisInput input,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.AnalyzeAsync(
                input,
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new
            {
                error = ex.Message
            });
        }
    }
}