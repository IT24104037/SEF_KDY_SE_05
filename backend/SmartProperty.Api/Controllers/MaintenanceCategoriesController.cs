using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/maintenance-categories")]
[Authorize]
public class MaintenanceCategoriesController : ControllerBase
{
    private readonly IMaintenanceCategoryService _service;

    public MaintenanceCategoriesController(
        IMaintenanceCategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false)
    {
        var categories =
            await _service.GetAllAsync(includeInactive);

        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        CreateMaintenanceCategoryDto dto)
    {
        try
        {
            var category =
                await _service.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetAll),
                new { id = category.Id },
                category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        UpdateMaintenanceCategoryDto dto)
    {
        try
        {
            var category =
                await _service.UpdateAsync(id, dto);

            if (category == null)
            {
                return NotFound(
                    new { message = "Maintenance category not found." });
            }

            return Ok(category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new { message = ex.Message });
        }
    }
}