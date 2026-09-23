using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/workers")]
public class WorkersController : ControllerBase
{
    private readonly IWorkerService _workerService;

    public WorkersController(IWorkerService workerService)
    {
        _workerService = workerService;
    }

    // POST /api/workers/upload-proof
    [AllowAnonymous]
    [HttpPost("upload-proof")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadProof([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Please select a document or image." });
        }

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "workers");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, safeFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var documentUrl = $"/uploads/workers/{safeFileName}";
        return Ok(new { documentUrl, fileName = file.FileName });
    }

    // POST /api/workers/register
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterWorker([FromBody] RegisterWorkerDto dto)
    {
        try
        {
            var result = await _workerService.RegisterWorkerAsync(dto);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/workers
    [Authorize(Roles = "Admin,PropertyOwner")]
    [HttpGet]
    public async Task<IActionResult> GetWorkers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _workerService.GetWorkersAsync(search, status, page, pageSize);
        return Ok(result);
    }

    // GET /api/workers/{id}
    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetWorkerById(int id)
    {
        var worker = await _workerService.GetWorkerByIdAsync(id);
        if (worker == null)
        {
            return NotFound(new { message = "Worker not found." });
        }

        return Ok(worker);
    }

    // GET /api/workers/me
    // GET /api/workers/me/status
    [Authorize(Roles = "MaintenanceWorker")]
    [HttpGet("me")]
    [HttpGet("me/status")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var worker = await _workerService.GetWorkerByUserIdAsync(userId);
        if (worker == null)
        {
            return NotFound(new { message = "Worker profile not found for this account." });
        }

        return Ok(worker);
    }

    // PUT /api/workers/me
    [Authorize(Roles = "MaintenanceWorker")]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateWorkerProfileDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var updated = await _workerService.UpdateMyProfileAsync(userId, dto);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT /api/admin/workers/{id}/verification
    [Authorize(Roles = "Admin")]
    [HttpPut("/api/admin/workers/{id:int}/verification")]
    public async Task<IActionResult> VerifyWorker(int id, [FromBody] VerifyWorkerDto dto)
    {
        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _workerService.VerifyWorkerAsync(id, dto, adminUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
