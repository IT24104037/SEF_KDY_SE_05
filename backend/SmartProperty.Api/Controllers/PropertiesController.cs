using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Interfaces;
using System.Security.Claims;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/properties")]
[Authorize(Roles = "PropertyOwner")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;

    public PropertiesController(IPropertyService propertyService)
    {
        _propertyService = propertyService;
    }

    private int GetUserId()
    {
        return int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );
    }

    // POST /api/properties
    [HttpPost]
    public async Task<IActionResult> CreateProperty(
        [FromBody] CreatePropertyDto request)
    {
        var result = await _propertyService.CreatePropertyAsync(
            GetUserId(),
            request);

        if (result == null)
        {
            return Forbid();
        }

        return CreatedAtAction(
            nameof(GetProperty),
            new { id = result.Id },
            result);
    }

    // GET /api/properties
    [HttpGet]
    public async Task<IActionResult> GetMyProperties()
    {
        var result = await _propertyService.GetMyPropertiesAsync(
            GetUserId());

        return Ok(result);
    }

    // GET /api/properties/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProperty(int id)
    {
        var result = await _propertyService.GetPropertyByIdAsync(
            GetUserId(),
            id);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    // PUT /api/properties/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProperty(
        int id,
        [FromBody] UpdatePropertyDto request)
    {
        var result = await _propertyService.UpdatePropertyAsync(
            GetUserId(),
            id,
            request);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    // DELETE /api/properties/{id}
    // Uses archive instead of permanently deleting the property.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> ArchiveProperty(int id)
    {
        var result = await _propertyService.ArchivePropertyAsync(
            GetUserId(),
            id);

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    // POST /api/properties/{id}/units
    [HttpPost("{id:int}/units")]
    public async Task<IActionResult> CreateUnit(
        int id,
        [FromBody] CreateUnitDto request)
    {
        var result = await _propertyService.CreateUnitAsync(
            GetUserId(),
            id,
            request);

        if (result == null)
        {
            return BadRequest(
                "Property not found, owner is not verified, or unit label already exists.");
        }

        return Ok(result);
    }

    // GET /api/properties/{id}/units
    [HttpGet("{id:int}/units")]
    public async Task<IActionResult> GetUnits(int id)
    {
        var result = await _propertyService.GetUnitsAsync(
            GetUserId(),
            id);

        return Ok(result);
    }

    // GET /api/properties/{propertyId}/units/{unitId}
    [HttpGet("{propertyId:int}/units/{unitId:int}")]
    public async Task<IActionResult> GetUnit(
        int propertyId,
        int unitId)
    {
        var result = await _propertyService.GetUnitByIdAsync(
            GetUserId(),
            propertyId,
            unitId);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}