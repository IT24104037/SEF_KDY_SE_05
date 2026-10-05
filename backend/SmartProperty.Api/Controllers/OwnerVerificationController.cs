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
        .Where(po => po.UserId == userId)
        .Select(po => new
        {
            po.Id,

            FullName = po.User!.FullName,
            Email = po.User.Email,
            Mobile = po.User.Mobile,

            po.VerificationStatus,
            po.RejectionReason,
            po.VerifiedAt,

            Property = po.Properties
                .OrderBy(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Name,
                    p.Address,
                    p.City,
                    p.Description,
                    p.Latitude,
                    p.Longitude
                })
                .FirstOrDefault(),

            Document = po.VerificationDocuments
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    d.DocumentType,
                    d.DocumentUrl
                })
                .FirstOrDefault()
        })
        .FirstOrDefaultAsync();

    if (owner == null)
    {
        return NotFound(new
        {
            message =
                "Property owner profile was not found."
        });
    }

    return Ok(new
    {
        ownerId = owner.Id,
        fullName = owner.FullName,
        email = owner.Email,
        mobile = owner.Mobile,
        status = owner.VerificationStatus.ToString(),
        rejectionReason = owner.RejectionReason,
        verifiedAt = owner.VerifiedAt,

        property = owner.Property == null
            ? null
            : new
            {
                name = owner.Property.Name,
                address = owner.Property.Address,
                city = owner.Property.City,
                description = owner.Property.Description,
                latitude = owner.Property.Latitude,
                longitude = owner.Property.Longitude
            },

        document = owner.Document == null
            ? null
            : new
            {
                documentType =
                    owner.Document.DocumentType,

                documentUrl =
                    owner.Document.DocumentUrl
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

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { message = "Full name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var email = request.Email.Trim();
        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email))
        {
            return BadRequest(new { message = "Invalid email format." });
        }

        if (string.IsNullOrWhiteSpace(request.Mobile))
        {
            return BadRequest(new { message = "Mobile number is required." });
        }

        var mobile = request.Mobile.Trim();
        if (mobile.Length != 10 || !mobile.All(char.IsDigit))
        {
            return BadRequest(new { message = "Mobile number must contain exactly 10 digits." });
        }

        if (string.IsNullOrWhiteSpace(request.PropertyName))
        {
            return BadRequest(new { message = "Property name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.PropertyAddress))
        {
            return BadRequest(new { message = "Property address is required." });
        }

        if (string.IsNullOrWhiteSpace(request.DocumentType))
        {
            return BadRequest(new { message = "Document type is required." });
        }

        if (string.IsNullOrWhiteSpace(request.DocumentUrl))
        {
            return BadRequest(new { message = "Document URL is required." });
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