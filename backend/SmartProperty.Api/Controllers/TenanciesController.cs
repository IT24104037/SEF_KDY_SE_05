using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/tenancies")]
[Authorize] // every action still requires a valid role below
public class TenanciesController : ControllerBase
{
    private readonly ITenancyService _tenancyService;

    public TenanciesController(ITenancyService tenancyService)
    {
        _tenancyService = tenancyService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Missing user id claim."));

    // POST /api/tenancies
    [HttpPost]
    [Authorize(Roles = "PropertyOwner")]
    public async Task<IActionResult> CreateTenancy([FromBody] CreateTenancyDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var tenancy = await _tenancyService.CreateTenancyAsync(dto, CurrentUserId);
            return StatusCode(201, tenancy);
        }
        catch (InvalidOperationException ex)
        {
            // e.g. unit already has an active tenancy, or bad dates
            return Conflict(new { message = ex.Message });
        }
    }

    // GET /api/tenancies/tenant/{tenantId} (Owner only)
    [HttpGet("tenant/{tenantId}")]
    [Authorize(Roles = "PropertyOwner")]
    public async Task<IActionResult> GetTenanciesForTenant(int tenantId)
    {
        var tenancies = await _tenancyService.GetTenanciesForTenantAsync(tenantId, CurrentUserId);
        return tenancies == null
            ? NotFound(new { message = "Tenant not found." })
            : Ok(tenancies);
    }

    // GET /api/tenancies/current  (Tenant only — their own active tenancy)
    [HttpGet("current")]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> GetCurrent()
    {
        var tenancy = await _tenancyService.GetCurrentTenancyAsync(CurrentUserId);
        return tenancy == null
            ? NotFound(new { message = "No active tenancy found." })
            : Ok(tenancy);
    }

    // GET /api/tenancies/history  (Tenant only — their own history)
    [HttpGet("history")]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _tenancyService.GetTenancyHistoryAsync(CurrentUserId);
        return Ok(history);
    }

    // PUT /api/tenancies/{id}/end
    [HttpPut("{id}/end")]
    [Authorize(Roles = "PropertyOwner")]
    public async Task<IActionResult> EndTenancy(int id, [FromBody] EndTenancyDto dto)
    {
        try
        {
            var ended = await _tenancyService.EndTenancyAsync(id, dto);
            return ended
                ? NoContent()
                : NotFound(new { message = "Tenancy not found." });
        }
        catch (InvalidOperationException ex)
        {
            // e.g. tenancy already ended
            return Conflict(new { message = ex.Message });
        }
    }
}