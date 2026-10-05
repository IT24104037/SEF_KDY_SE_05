using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Maintenance;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/tenant/notifications")]
[Authorize(Roles = "Tenant")]
public class TenantNotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TenantNotificationsController(
        AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<
        ActionResult<List<TenantMaintenanceNotificationDto>>>
        GetMaintenanceNotifications()
    {
        var userIdValue =
            User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!int.TryParse(
                userIdValue,
                out var currentUserId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "Unable to identify the current user."
                });
        }

        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == currentUserId);

        if (tenant == null)
        {
            return Ok(
                new List<TenantMaintenanceNotificationDto>());
        }

        // Only decisions related to THIS tenant's
        // maintenance requests.
        var decisions = await (
            from decision in
                _context.ApprovalDecisions.AsNoTracking()

            join request in
                _context.MaintenanceRequests.AsNoTracking()

            on decision.MaintenanceRequestId
                equals request.Id

            where
                request.TenantId == tenant.Id &&
                (
                    decision.Decision == "Approved" ||
                    decision.Decision == "Rejected"
                )

            orderby decision.DecidedAt descending

            select decision
        ).ToListAsync();

        if (decisions.Count == 0)
        {
            return Ok(
                new List<TenantMaintenanceNotificationDto>());
        }

        var requestIds = decisions
            .Select(x => x.MaintenanceRequestId)
            .Distinct()
            .ToList();

        var workOrders = await _context.WorkOrders
            .AsNoTracking()
            .Include(x => x.Worker)
                .ThenInclude(x => x.User)
            .Where(x =>
                requestIds.Contains(
                    x.MaintenanceRequestId))
            .ToListAsync();

        var result =
            new List<TenantMaintenanceNotificationDto>();

        foreach (var decision in decisions)
        {
            var isApproved =
                string.Equals(
                    decision.Decision,
                    "Approved",
                    StringComparison.OrdinalIgnoreCase);

            // Normal ProcessApprovalAsync creates the work order
            // immediately after recording the ApprovalDecision.
            // A manual no-worker approval does NOT create one.
            var workOrder =
                isApproved
                    ? workOrders
                        .Where(x =>
                            x.MaintenanceRequestId ==
                                decision.MaintenanceRequestId &&
                            x.CreatedAt >=
                                decision.DecidedAt &&
                            x.CreatedAt <=
                                decision.DecidedAt.AddMinutes(1))
                        .OrderBy(x => x.CreatedAt)
                        .FirstOrDefault()
                    : null;

            result.Add(
                new TenantMaintenanceNotificationDto
                {
                    Id = decision.Id,

                    MaintenanceRequestId =
                        decision.MaintenanceRequestId,

                    Decision =
                        decision.Decision,

                    OwnerMessage =
                        decision.Notes,

                    DecidedAt =
                        decision.DecidedAt,

                    HasAssignedWorker =
                        workOrder != null,

                    WorkerName =
                        workOrder?.Worker?.User?.FullName,

                    ScheduledDateTime =
                        workOrder?.ScheduledDate
                });
        }

        return Ok(result);
    }
}