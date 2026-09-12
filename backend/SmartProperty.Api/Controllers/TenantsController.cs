using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Interfaces;
using SmartProperty.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/tenants")]
[Authorize(Roles = "PropertyOwner")] // only a verified Property Owner may manage tenants
public class TenantsController : ControllerBase
{
    private readonly ITenancyService _tenancyService;
    private readonly AppDbContext _context;

    public TenantsController(ITenancyService tenancyService, AppDbContext context)
    {
        _tenancyService = tenancyService;
        _context = context;
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var properties = await _context.Properties
            .Where(p => p.PropertyOwner.UserId == OwnerUserId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                Units = p.Units.Select(u => new { u.Id, u.Name })
            })
            .ToListAsync();

        return Ok(properties);
    }

    private int OwnerUserId => int.Parse(User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // POST /api/tenants
    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var tenant = await _tenancyService.CreateTenantAsync(dto, OwnerUserId);
            return CreatedAtAction(nameof(GetTenantById), new { id = tenant.Id }, tenant);
        }
        catch (InvalidOperationException ex)
        {
            // e.g. duplicate mobile number
            return Conflict(new { message = ex.Message });
        }
    }

    // GET /api/tenants?search=&isActive=&sortBy=&descending=&page=&pageSize=
    [HttpGet]
    public async Task<IActionResult> GetTenants([FromQuery] TenantQueryParameters query)
    {
        var result = await _tenancyService.GetTenantsAsync(query, OwnerUserId);
        return Ok(result);
    }

    // GET /api/tenants/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTenantById(int id)
    {
        var tenant = await _tenancyService.GetTenantByIdAsync(id, OwnerUserId);
        return tenant == null
            ? NotFound(new { message = "Tenant not found." })
            : Ok(tenant);
    }

    // PUT /api/tenants/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _tenancyService.UpdateTenantAsync(id, dto, OwnerUserId);
        return updated == null
            ? NotFound(new { message = "Tenant not found." })
            : Ok(updated);
    }
}