using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(
        IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminUserService.GetUsersAsync(
            search,
            role,
            isActive,
            page,
            pageSize);

        return Ok(result);
    }

    [HttpPut("{id:int}/suspend")]
    public async Task<IActionResult> SuspendUser(int id)
    {
        var currentUserId =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (currentUserId == id.ToString())
        {
            return BadRequest(
                new { message = "You cannot suspend your own account." });
        }

        var result =
            await _adminUserService.SetUserStatusAsync(id, false);

        if (!result)
            return NotFound(new { message = "User not found." });

        return Ok(new { message = "User suspended successfully." });
    }

    [HttpPut("{id:int}/reactivate")]
    public async Task<IActionResult> ReactivateUser(int id)
    {
        var result =
            await _adminUserService.SetUserStatusAsync(id, true);

        if (!result)
            return NotFound(new { message = "User not found." });

        return Ok(new { message = "User reactivated successfully." });
    }
}