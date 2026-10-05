using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/workers")]
public class WorkerAvailabilityController : ControllerBase
{
    private readonly IWorkerService _workerService;

    public WorkerAvailabilityController(IWorkerService workerService)
    {
        _workerService = workerService;
    }

    // GET /api/workers/me/availability
    [Authorize(Roles = "MaintenanceWorker")]
    [HttpGet("me/availability")]
    public async Task<IActionResult> GetMyAvailability()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _workerService.GetMyAvailabilityAsync(userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // PUT /api/workers/me/availability
    [Authorize(Roles = "MaintenanceWorker")]
    [HttpPut("me/availability")]
    public async Task<IActionResult> UpdateMyAvailability([FromBody] UpdateAvailabilityDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _workerService.UpdateMyAvailabilityAsync(userId, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/workers/{id}/free-now
    [Authorize]
    [HttpGet("{id:int}/free-now")]
    public async Task<IActionResult> CheckWorkerFreeNow(int id)
    {
        bool isFree = await _workerService.IsWorkerFreeNowAsync(id);
        return Ok(new { workerId = id, isFreeNow = isFree });
    }
}

