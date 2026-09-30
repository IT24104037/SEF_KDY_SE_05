using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/tenants/me")]
[Authorize(Roles = "Tenant")]
public class TenantProfileController : ControllerBase
{
    private readonly ITenancyService _tenancyService;

    public TenantProfileController(ITenancyService tenancyService)
    {
        _tenancyService = tenancyService;
    }

    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetMyProfile()
    {
        var tenant =
            await _tenancyService.GetMyProfileAsync(CurrentUserId);

        return tenant == null
            ? NotFound(new { message = "Tenant profile not found." })
            : Ok(tenant);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateTenantProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated =
                await _tenancyService.UpdateMyProfileAsync(
                    CurrentUserId,
                    dto);

            return updated == null
                ? NotFound(new { message = "Tenant profile not found." })
                : Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}