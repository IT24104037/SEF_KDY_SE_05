using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Interfaces;
using System.Security.Claims;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/owners")]
public class OwnerVerificationController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;

    public OwnerVerificationController(
        IAuthService authService,
        AppDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    // POST /api/owners/register
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterOwner(
        [FromBody] RegisterOwnerDto request)
    {
        var result = await _authService.RegisterOwnerAsync(request);

        if (!result)
        {
            return Conflict(new
            {
                message = "Email or mobile is already registered."
            });
        }

        return Ok(new
        {
            message = "Owner registration submitted successfully. Your account is pending verification."
        });
    }

    // GET /api/owners/me/verification
    [Authorize(Roles = "PropertyOwner")]
    [HttpGet("me/verification")]
    public async Task<IActionResult> GetMyVerificationStatus()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var owner = await _context.PropertyOwners
            .AsNoTracking()
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return NotFound(new
            {
                message = "Property owner profile was not found."
            });
        }

        return Ok(new
        {
            ownerId = owner.Id,
            status = owner.VerificationStatus.ToString(),
            verifiedAt = owner.VerifiedAt
        });
    }
}