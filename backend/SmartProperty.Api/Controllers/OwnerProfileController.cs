using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Owners;
using SmartProperty.Api.Entities.Property;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/owners")]
[Authorize(Roles = "PropertyOwner")]
public class OwnerProfileController : ControllerBase
{
    private readonly AppDbContext _context;

    public OwnerProfileController(AppDbContext context)
    {
        _context = context;
    }

    // POST /api/owners/me/profile-change-request
    // PUT  /api/owners/me/profile-change-request
    [HttpPost("me/profile-change-request")]
    [HttpPut("me/profile-change-request")]
    public async Task<IActionResult> CreateProfileChangeRequest(
        [FromBody] CreateOwnerProfileChangeRequestDto request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var owner = await _context.PropertyOwners
            .Include(po => po.User)
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return NotFound(new { message = "Property owner profile was not found." });
        }

        if (owner.VerificationStatus != OwnerVerificationStatus.Verified)
        {
            return BadRequest(new { message = "Only verified property owners can submit profile change requests." });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { message = "FullName is required." });
        }

        var fullName = request.FullName.Trim();
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        var mobile = string.IsNullOrWhiteSpace(request.Mobile) ? null : request.Mobile.Trim();

        if (email != null && !new EmailAddressAttribute().IsValid(email))
        {
            return BadRequest(new { message = "Invalid email format." });
        }

        var hasDuplicate = await _context.Users.AnyAsync(u =>
            u.Id != userId &&
            ((email != null && u.Email != null && u.Email.ToLower() == email.ToLower()) ||
             (mobile != null && u.Mobile != null && u.Mobile == mobile)));

        if (hasDuplicate)
        {
            return Conflict(new { message = "Email or mobile is already registered." });
        }

        var hasPendingRequest = await _context.OwnerProfileChangeRequests.AnyAsync(r =>
            r.PropertyOwnerId == owner.Id &&
            r.Status == OwnerProfileChangeRequestStatus.Pending);

        if (hasPendingRequest)
        {
            return BadRequest(new { message = "You already have a pending profile change request." });
        }

        var profileRequest = new OwnerProfileChangeRequest
        {
            PropertyOwnerId = owner.Id,
            RequestedFullName = fullName,
            RequestedEmail = email,
            RequestedMobile = mobile,
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.OwnerProfileChangeRequests.Add(profileRequest);
        await _context.SaveChangesAsync();

        var response = new OwnerProfileChangeRequestResponseDto
        {
            Id = profileRequest.Id,
            PropertyOwnerId = profileRequest.PropertyOwnerId,
            RequestedFullName = profileRequest.RequestedFullName,
            RequestedEmail = profileRequest.RequestedEmail,
            RequestedMobile = profileRequest.RequestedMobile,
            Status = profileRequest.Status.ToString(),
            RejectionReason = profileRequest.RejectionReason,
            CreatedAt = profileRequest.CreatedAt,
            ReviewedAt = profileRequest.ReviewedAt
        };

        return Ok(response);
    }

    // GET /api/owners/me/profile-change-request
    [HttpGet("me/profile-change-request")]
    public async Task<IActionResult> GetMyProfileChangeRequest()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var owner = await _context.PropertyOwners
            .AsNoTracking()
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return NotFound(new { message = "Property owner profile was not found." });
        }

        var profileRequest = await _context.OwnerProfileChangeRequests
            .AsNoTracking()
            .Where(r => r.PropertyOwnerId == owner.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (profileRequest == null)
        {
            return NotFound(new { message = "No profile change request found." });
        }

        var response = new OwnerProfileChangeRequestResponseDto
        {
            Id = profileRequest.Id,
            PropertyOwnerId = profileRequest.PropertyOwnerId,
            RequestedFullName = profileRequest.RequestedFullName,
            RequestedEmail = profileRequest.RequestedEmail,
            RequestedMobile = profileRequest.RequestedMobile,
            Status = profileRequest.Status.ToString(),
            RejectionReason = profileRequest.RejectionReason,
            CreatedAt = profileRequest.CreatedAt,
            ReviewedAt = profileRequest.ReviewedAt
        };

        return Ok(response);
    }
}
