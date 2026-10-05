using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/tenant-activation")]
// NO [Authorize] here on purpose — this runs BEFORE any session/JWT exists.
public class TenantActivationController : ControllerBase
{
    private readonly ITenancyService _tenancyService;

    public TenantActivationController(ITenancyService tenancyService)
    {
        _tenancyService = tenancyService;
    }

    // POST /api/tenant-activation/activate
    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ActivateTenantDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _tenancyService.ActivateTenantAsync(dto);

        return result.Success ? Ok(result) : BadRequest(result);
    }
}