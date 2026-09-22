using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminDashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalUsers =
            await _context.Users.CountAsync();

        var maintenanceRequests =
            await _context.MaintenanceRequests
                .CountAsync(x =>
                    x.RequestType == "NORMAL");

        var emergencyRequests =
            await _context.MaintenanceRequests
                .CountAsync(x =>
                    x.RequestType == "EMERGENCY");

        // Agent workflow is not implemented yet.
        var activeAiWorkflows = 0;

        return Ok(new
        {
            totalUsers,
            maintenanceRequests,
            emergencyRequests,
            activeAiWorkflows
        });
    }
}