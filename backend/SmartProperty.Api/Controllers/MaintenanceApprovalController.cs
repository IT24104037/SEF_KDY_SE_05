using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/maintenance-requests")]
[Authorize(Roles = "PropertyOwner,Admin")]
public class MaintenanceApprovalController : ControllerBase
{
    private readonly IWorkerRecommendationService _recommendationService;

    public MaintenanceApprovalController(IWorkerRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    // GET /api/maintenance-requests/{id}/recommendation
    [HttpGet("{id:int}/recommendation")]
    public async Task<IActionResult> GetRecommendation(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var recommendation = await _recommendationService.GetRecommendationAsync(id, userId, role);
            return Ok(recommendation);
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

    // POST /api/maintenance-requests/{id}/approval
    [HttpPost("{id:int}/approval")]
    public async Task<IActionResult> SubmitApproval(int id, [FromBody] ApprovalRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _recommendationService.ProcessApprovalAsync(id, dto, userId, role);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/maintenance-requests/pending-approvals
    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var results = await _recommendationService.GetPendingApprovalsForOwnerAsync(userId, role);
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
