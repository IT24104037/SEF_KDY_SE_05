using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/work-orders")]
[Authorize(Roles = "MaintenanceWorker,PropertyOwner,Admin")]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;

    public WorkOrdersController(IWorkOrderService workOrderService)
    {
        _workOrderService = workOrderService;
    }

    // GET /api/work-orders
    [HttpGet]
    public async Task<IActionResult> GetWorkOrders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _workOrderService.GetWorkOrdersAsync(userId, role, status, page, pageSize);
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

    // GET /api/work-orders/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetWorkOrderById(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var workOrder = await _workOrderService.GetWorkOrderByIdAsync(id, userId, role);
            if (workOrder == null)
            {
                return NotFound(new { message = $"Work order #{id} not found." });
            }
            return Ok(workOrder);
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

    // PUT /api/work-orders/{id}/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateWorkOrderStatusDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var updated = await _workOrderService.UpdateWorkOrderStatusAsync(id, dto, userId, role);
            return Ok(updated);
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
