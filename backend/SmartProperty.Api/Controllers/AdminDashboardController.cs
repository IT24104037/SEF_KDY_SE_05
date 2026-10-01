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

      var requestCounts =
    await _context.MaintenanceRequests
        .GroupBy(x => 1)
        .Select(group => new
        {
            MaintenanceRequests =
                group.Count(x =>
                    x.RequestType == "NORMAL"),

            EmergencyRequests =
                group.Count(x =>
                    x.RequestType == "EMERGENCY")
        })
        .FirstOrDefaultAsync();

        var maintenanceRequests =
            requestCounts?.MaintenanceRequests ?? 0;

        var emergencyRequests =
            requestCounts?.EmergencyRequests ?? 0;

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