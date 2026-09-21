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
            .Include(po => po.User)
            .Include(po => po.Properties)
                .ThenInclude(p => p.VerificationDocuments)
            .Include(po => po.VerificationDocuments)
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return NotFound(new
            {
                message = "Property owner profile was not found."
            });
        }

        var property = owner.Properties
            .OrderBy(p => p.CreatedAt)
            .FirstOrDefault();
        var document = owner.VerificationDocuments
            .OrderByDescending(d => d.UploadedAt)
            .FirstOrDefault();

        return Ok(new
        {
            ownerId = owner.Id,
            fullName = owner.User!.FullName,
            email = owner.User.Email,
            mobile = owner.User.Mobile,
            status = owner.VerificationStatus.ToString(),
            rejectionReason = owner.RejectionReason,
            verifiedAt = owner.VerifiedAt,
            property = property == null ? null : new
            {
                name = property.Name,
                address = property.Address,
                city = property.City,
                description = property.Description,
                latitude = property.Latitude,
                longitude = property.Longitude
            },
            document = document == null ? null : new
            {
                documentType = document.DocumentType,
                documentUrl = document.DocumentUrl
            }
        });
    }

    [Authorize(Roles = "PropertyOwner")]
    [HttpPut("me/reapply")]
    public async Task<IActionResult> Reapply(
        [FromBody] OwnerReapplyRequestDto request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var owner = await _context.PropertyOwners
            .Include(po => po.User)
            .Include(po => po.Properties)
                .ThenInclude(p => p.VerificationDocuments)
            .Include(po => po.VerificationDocuments)
            .FirstOrDefaultAsync(po => po.UserId == userId);

        if (owner == null)
        {
            return NotFound(new { message = "Property owner profile was not found." });
        }

        if (owner.VerificationStatus != OwnerVerificationStatus.Rejected)
        {
            return BadRequest(new { message = "Only rejected owners can reapply." });
        }

        var duplicateContact = await _context.Users.AnyAsync(u =>
            u.Id != userId &&
            ((request.Email != null && u.Email != null &&
              u.Email.ToLower() == request.Email.Trim().ToLower()) ||
             (request.Mobile != null && u.Mobile == request.Mobile.Trim())));

        if (duplicateContact)
        {
            return Conflict(new { message = "Email or mobile is already registered." });
        }

        owner.User!.FullName = request.FullName.Trim();
        owner.User.Email = request.Email?.Trim();
        owner.User.Mobile = request.Mobile?.Trim();
        owner.VerificationStatus = OwnerVerificationStatus.PendingVerification;
        owner.RejectionReason = null;
        owner.VerifiedAt = null;
        owner.VerifiedByAdminId = null;
        owner.UpdatedAt = DateTime.UtcNow;

        var property = owner.Properties
            .OrderBy(p => p.CreatedAt)
            .FirstOrDefault();

        if (property == null)
        {
            return BadRequest(new { message = "The initial property was not found." });
        }

        property.Name = request.PropertyName.Trim();
        property.Address = request.PropertyAddress.Trim();
        property.City = request.City?.Trim();
        property.Description = request.PropertyDescription?.Trim();
        property.Latitude = request.Latitude;
        property.Longitude = request.Longitude;
        property.VerificationStatus = PropertyVerificationStatus.UnderReview;
        property.RejectionReason = null;
        property.VerifiedAt = null;
        property.VerifiedByAdminId = null;
        property.SubmittedAt = DateTime.UtcNow;
        property.UpdatedAt = DateTime.UtcNow;

        _context.OwnerVerificationDocuments.RemoveRange(owner.VerificationDocuments);
        _context.PropertyVerificationDocuments.RemoveRange(property.VerificationDocuments);
        _context.OwnerVerificationDocuments.Add(new OwnerVerificationDocument
        {
            PropertyOwnerId = owner.Id,
            DocumentType = request.DocumentType.Trim(),
            DocumentUrl = request.DocumentUrl.Trim()
        });
        _context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = request.DocumentType.Trim(),
            DocumentUrl = request.DocumentUrl.Trim()
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            ownerId = owner.Id,
            status = owner.VerificationStatus.ToString()
        });
    }
}