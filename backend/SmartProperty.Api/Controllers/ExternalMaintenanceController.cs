using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Authorize(Roles = "PropertyOwner,Admin")]
public class ExternalMaintenanceController : ControllerBase
{
    private readonly IExternalMaintenanceService _service;

    public ExternalMaintenanceController(IExternalMaintenanceService service)
    {
        _service = service;
    }

    // POST /api/maintenance-requests/{id}/external-arrangement
    [HttpPost("api/maintenance-requests/{id:int}/external-arrangement")]
    public async Task<IActionResult> CreateArrangement(int id, [FromBody] CreateExternalArrangementDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _service.CreateArrangementAsync(id, dto, userId, role);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/maintenance-requests/{id}/external-arrangements
    [HttpGet("api/maintenance-requests/{id:int}/external-arrangements")]
    public async Task<IActionResult> GetArrangementsForRequest(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var results = await _service.GetArrangementsAsync(userId, role, id);
            return Ok(results);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/external-arrangements/{id}
    [HttpGet("api/external-arrangements/{id:int}")]
    public async Task<IActionResult> GetArrangementById(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _service.GetArrangementByIdAsync(id, userId, role);
            if (result == null)
            {
                return NotFound(new { message = $"External arrangement #{id} not found." });
            }
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT /api/external-arrangements/{id}
    [HttpPut("api/external-arrangements/{id:int}")]
    public async Task<IActionResult> UpdateArrangement(int id, [FromBody] UpdateExternalArrangementDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _service.UpdateArrangementAsync(id, dto, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT /api/external-arrangements/{id}/confirm
    [HttpPut("api/external-arrangements/{id:int}/confirm")]
    public async Task<IActionResult> ConfirmArrangement(int id, [FromBody] ConfirmExternalArrangementDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _service.ConfirmArrangementAsync(id, dto, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }
        return userId;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
