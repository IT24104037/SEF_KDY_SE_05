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

    // GET /api/properties/archived
    [HttpGet("archived")]
    public async Task<IActionResult> GetArchivedProperties()
    {
        var result = await _propertyService.GetArchivedPropertiesAsync(
            GetUserId());

        return Ok(result);
    }

    // GET /api/properties/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetOwnerDashboard()
    {
        var result = await _propertyService.GetOwnerDashboardAsync(
            GetUserId());

        if (result == null)
        {
            return Forbid();
        }

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

    // PUT /api/properties/{id}/resubmit
    [HttpPut("{id:int}/resubmit")]
    public async Task<IActionResult> ResubmitProperty(
        int id,
        [FromBody] ResubmitPropertyDto request)
    {
        var result = await _propertyService.ResubmitRejectedPropertyAsync(
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
    // PUT /api/properties/{id}/restore
        [HttpPut("{id:int}/restore")]
        public async Task<IActionResult> RestoreProperty(int id)
        {
            var result = await _propertyService.RestorePropertyAsync(
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

        if (!result.Success)
        {
            return BadRequest(new
            {
                message = result.ErrorMessage
            });
        }

        return Ok(result.Unit);
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

    // GET /api/properties/{id}/units/archived
[HttpGet("{id:int}/units/archived")]
public async Task<IActionResult> GetArchivedUnits(int id)
{
    var result = await _propertyService.GetArchivedUnitsAsync(
        GetUserId(),
        id);

    return Ok(result);
}

    // PUT /api/properties/{propertyId}/units/{unitId}
    [HttpPut("{propertyId:int}/units/{unitId:int}")]
    public async Task<IActionResult> UpdateUnit(
        int propertyId,
        int unitId,
        [FromBody] UpdateUnitDto request)
    {
        var result = await _propertyService.UpdateUnitAsync(
            GetUserId(),
            propertyId,
            unitId,
            request);

        if (result == null)
        {
            return BadRequest(
                "Property or unit not found, owner is not verified, or unit label already exists.");
        }

        return Ok(result);
    }

    // DELETE /api/properties/{propertyId}/units/{unitId}
    // Uses archive instead of permanently deleting the unit.
    [HttpDelete("{propertyId:int}/units/{unitId:int}")]
    public async Task<IActionResult> ArchiveUnit(
        int propertyId,
        int unitId)
    {
        var result = await _propertyService.ArchiveUnitAsync(
            GetUserId(),
            propertyId,
            unitId);

        if (!result)
        {
            return BadRequest(new { message = "Cannot archive unit. The unit was not found or has an active tenancy." });
        }

        return NoContent();
    }

    // DELETE /api/properties/{propertyId}/units/{unitId}/soft-delete
    // Soft deletes an archived unit while preserving its database record.
    [HttpDelete("{propertyId:int}/units/{unitId:int}/soft-delete")]
    public async Task<IActionResult> SoftDeleteUnit(
        int propertyId,
        int unitId)
    {
        var result = await _propertyService.SoftDeleteUnitAsync(
            GetUserId(),
            propertyId,
            unitId);

        if (!result)
        {
            return BadRequest(new { message = "Cannot delete unit. The archived unit was not found or has an active tenancy." });
        }

        return NoContent();
    }

[HttpPut("{propertyId:int}/units/{unitId:int}/restore")]
public async Task<IActionResult> RestoreUnit(
    int propertyId,
    int unitId)
{
    var result = await _propertyService.RestoreUnitAsync(
        GetUserId(),
        propertyId,
        unitId);

    if (result.DuplicateLabel)
    {
        return Conflict(new
        {
            message = result.ErrorMessage
        });
    }

    if (!result.Success)
    {
        return NotFound(new
        {
            message = result.ErrorMessage
        });
    }

    return NoContent();
}

    // GET /api/properties/{propertyId}/units/{unitId}/tenancy-history/export
    [HttpGet("{propertyId:int}/units/{unitId:int}/tenancy-history/export")]
    public async Task<IActionResult> ExportUnitTenancyHistory(
        int propertyId,
        int unitId)
    {
        var result = await _propertyService.ExportUnitTenancyHistoryAsync(
            GetUserId(),
            propertyId,
            unitId);

        if (result == null)
        {
            return NotFound(new { message = "Property or unit was not found, or you do not have permission to access it." });
        }

        var fileName = $"{result.Value.UnitLabel}_Tenancy_History.xlsx";

        return File(
            result.Value.FileBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    // POST /api/properties/{propertyId}/units/bulk
    [HttpPost("{propertyId:int}/units/bulk")]
    public async Task<IActionResult> CreateBulkUnits(
        int propertyId,
        [FromBody] CreateBulkUnitsDto request)
    {
        var result = await _propertyService.CreateBulkUnitsAsync(
            GetUserId(),
            propertyId,
            request);

        if (!result.Success)
{
    return BadRequest(new
    {
        message = result.ErrorMessage
    });
}

    return Ok(result.Units);
    }
}
