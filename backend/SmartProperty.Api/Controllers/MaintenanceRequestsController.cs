using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/maintenance-requests")]
[Authorize(Roles = "Admin,PropertyOwner,Tenant")]
public class MaintenanceRequestsController : ControllerBase
{
    private readonly IMaintenanceRequestService _service;

    public MaintenanceRequestsController(
        IMaintenanceRequestService service)
    {
        _service = service;
    }

    // ---------------------------------------------------------
    // CREATE
    // Tenant only
    // ---------------------------------------------------------

    [HttpPost]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> Create(
        CreateMaintenanceRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var request =
                await _service.CreateAsync(userId, dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = request.Id },
                request);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new { message = ex.Message });
        }
    }

    // ---------------------------------------------------------
    // GET ALL
    // ---------------------------------------------------------

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? requestType,
        [FromQuery] string? priority,
        [FromQuery] int? propertyId,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortDirection = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var result =
                await _service.GetAllAsync(
                    userId,
                    role,
                    search,
                    status,
                    requestType,
                    priority,
                    propertyId,
                    sortBy,
                    sortDirection,
                    page,
                    pageSize);

            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ---------------------------------------------------------
    // GET ONE
    // ---------------------------------------------------------

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var request =
                await _service.GetByIdAsync(
                    id,
                    userId,
                    role);

            if (request == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Maintenance request not found."
                    });
            }

            return Ok(request);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ---------------------------------------------------------
    // UPDATE DESCRIPTION
    // Tenant only
    // ---------------------------------------------------------

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> Update(
        int id,
        UpdateMaintenanceRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var request =
                await _service.UpdateAsync(
                    id,
                    userId,
                    role,
                    dto);

            if (request == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Maintenance request not found."
                    });
            }

            return Ok(request);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new { message = ex.Message });
        }
    }

    // ---------------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------------

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateMaintenanceStatusDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var request =
                await _service.UpdateStatusAsync(
                    id,
                    userId,
                    role,
                    dto);

            if (request == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Maintenance request not found."
                    });
            }

            return Ok(request);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new { message = ex.Message });
        }
    }

    // ---------------------------------------------------------
    // STATUS HISTORY
    // ---------------------------------------------------------

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var history =
                await _service.GetHistoryAsync(
                    id,
                    userId,
                    role);

            if (history == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Maintenance request not found."
                    });
            }

            return Ok(history);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ---------------------------------------------------------
    // JWT HELPERS
    // ---------------------------------------------------------

    private int GetCurrentUserId()
    {
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Invalid user identity.");
        }

        return userId;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(
                   ClaimTypes.Role)
               ?? string.Empty;
    }
}