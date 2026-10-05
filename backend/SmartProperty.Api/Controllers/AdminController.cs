using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Admin;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using System.Security.Claims;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/admin/owners
    [HttpGet("owners")]
    public async Task<IActionResult> GetAllOwners()
    {
        var owners = await _context.PropertyOwners
            .AsNoTracking()
            .Include(po => po.User)
            .Include(po => po.VerificationDocuments)
            .OrderByDescending(po => po.VerificationStatus == OwnerVerificationStatus.PendingVerification ? 1 : 0)
            .ThenByDescending(po => po.CreatedAt)
            .Select(po => new
            {
                ownerId = po.Id,
                userId = po.UserId,
                fullName = po.User!.FullName,
                email = po.User.Email,
                mobile = po.User.Mobile,
                status = po.VerificationStatus.ToString(),
                rejectionReason = po.RejectionReason,
                verifiedAt = po.VerifiedAt,
                createdAt = po.CreatedAt,
                documents = po.VerificationDocuments.Select(d => new
                {
                    d.Id,
                    d.DocumentType,
                    d.DocumentUrl,
                    d.UploadedAt
                })
            })
            .ToListAsync();

        return Ok(owners);
    }

    // GET /api/admin/owners/pending
    [HttpGet("owners/pending")]
    public async Task<IActionResult> GetPendingOwners()
    {
        var owners = await _context.PropertyOwners
            .AsNoTracking()
            .Include(po => po.User)
            .Include(po => po.VerificationDocuments)
            .Where(po =>
                po.VerificationStatus ==
                OwnerVerificationStatus.PendingVerification)
            .OrderBy(po => po.CreatedAt)
            .Select(po => new
            {
                ownerId = po.Id,
                userId = po.UserId,
                fullName = po.User!.FullName,
                email = po.User.Email,
                mobile = po.User.Mobile,
                status = po.VerificationStatus.ToString(),
                createdAt = po.CreatedAt,
                documents = po.VerificationDocuments.Select(d => new
                {
                    d.Id,
                    d.DocumentType,
                    d.DocumentUrl,
                    d.UploadedAt
                })
            })
            .ToListAsync();

        return Ok(owners);
    }

    // PUT /api/admin/owners/{id}/verification
    [HttpPut("owners/{id:int}/verification")]
    public async Task<IActionResult> UpdateOwnerVerification(
        int id,
        [FromBody] OwnerVerificationRequestDto request)
    {
        if (!Enum.TryParse<OwnerVerificationStatus>(
                request.Status,
                true,
                out var newStatus))
        {
            return BadRequest(new
            {
                message = "Status must be Verified or Rejected."
            });
        }

        if (newStatus == OwnerVerificationStatus.PendingVerification)
        {
            return BadRequest(new
            {
                message = "Admin cannot set an owner back to PendingVerification."
            });
        }

        if (newStatus == OwnerVerificationStatus.Rejected &&
            string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return BadRequest(new
            {
                message = "A rejection reason is required."
            });
        }

        var owner = await _context.PropertyOwners
            .Include(po => po.User)
            .FirstOrDefaultAsync(po => po.Id == id);

        if (owner == null)
        {
            return NotFound(new
            {
                message = "Property owner was not found."
            });
        }

        var adminIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(adminIdValue, out var adminId))
        {
            return Unauthorized();
        }

        owner.VerificationStatus = newStatus;
        owner.RejectionReason = newStatus == OwnerVerificationStatus.Rejected
            ? request.RejectionReason!.Trim()
            : null;

        if (newStatus == OwnerVerificationStatus.Verified)
        {
            owner.VerifiedAt = DateTime.UtcNow;
            owner.VerifiedByAdminId = adminId;
        }
        else
        {
            owner.VerifiedAt = null;
            owner.VerifiedByAdminId = adminId;
        }

        owner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            ownerId = owner.Id,
            status = owner.VerificationStatus.ToString(),
            rejectionReason = owner.RejectionReason,
            verifiedAt = owner.VerifiedAt
        });
    }

    // GET /api/admin/properties
    [HttpGet("properties")]
    public async Task<IActionResult> GetAllProperties()
    {
        var properties = await _context.Properties
            .AsNoTracking()
            .Include(p => p.PropertyOwner)
            .ThenInclude(po => po!.User)
            .Include(p => p.VerificationDocuments)
            .OrderByDescending(p => p.VerificationStatus == PropertyVerificationStatus.UnderReview ? 1 : 0)
            .ThenByDescending(p => p.SubmittedAt)
            .Select(p => new
            {
                propertyId = p.Id,
                ownerId = p.PropertyOwnerId,
                ownerName = p.PropertyOwner!.User!.FullName,
                ownerEmail = p.PropertyOwner!.User!.Email,
                name = p.Name,
                address = p.Address,
                city = p.City,
                description = p.Description,
                status = p.VerificationStatus.ToString(),
                rejectionReason = p.RejectionReason,
                submittedAt = p.SubmittedAt,
                verifiedAt = p.VerifiedAt,
                documents = p.VerificationDocuments.Select(d => new
                {
                    d.Id,
                    d.DocumentType,
                    d.DocumentUrl,
                    d.UploadedAt
                })
            })
            .ToListAsync();

        return Ok(properties);
    }

    // GET /api/admin/properties/pending
    [HttpGet("properties/pending")]
    public async Task<IActionResult> GetPendingProperties()
    {
        var properties = await _context.Properties
            .AsNoTracking()
            .Include(p => p.PropertyOwner)
            .ThenInclude(po => po!.User)
            .Include(p => p.VerificationDocuments)
            .Where(p => p.VerificationStatus == PropertyVerificationStatus.UnderReview)
            .OrderBy(p => p.SubmittedAt)
            .Select(p => new
            {
                propertyId = p.Id,
                ownerId = p.PropertyOwnerId,
                ownerName = p.PropertyOwner!.User!.FullName,
                ownerEmail = p.PropertyOwner!.User!.Email,
                name = p.Name,
                address = p.Address,
                city = p.City,
                description = p.Description,
                status = p.VerificationStatus.ToString(),
                submittedAt = p.SubmittedAt,
                documents = p.VerificationDocuments.Select(d => new
                {
                    d.Id,
                    d.DocumentType,
                    d.DocumentUrl,
                    d.UploadedAt
                })
            })
            .ToListAsync();

        return Ok(properties);
    }

    // GET /api/admin/properties/{id}
    [HttpGet("properties/{id:int}")]
    public async Task<IActionResult> GetPropertyVerificationDetails(int id)
    {
        var property = await _context.Properties
            .AsNoTracking()
            .Include(p => p.PropertyOwner)
            .ThenInclude(po => po!.User)
            .Include(p => p.VerificationDocuments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
        {
            return NotFound(new { message = "Property was not found." });
        }

        return Ok(new
        {
            property.Id,
            property.PropertyOwnerId,
            ownerName = property.PropertyOwner!.User!.FullName,
            ownerEmail = property.PropertyOwner!.User!.Email,
            property.Name,
            property.Address,
            property.City,
            property.Description,
            property.Latitude,
            property.Longitude,
            status = property.VerificationStatus.ToString(),
            property.RejectionReason,
            property.SubmittedAt,
            property.VerifiedAt,
            documents = property.VerificationDocuments.Select(d => new
            {
                d.Id,
                d.DocumentType,
                d.DocumentUrl,
                d.UploadedAt
            })
        });
    }

    // PUT /api/admin/properties/{id}/approve
    [HttpPut("properties/{id:int}/approve")]
    public async Task<IActionResult> ApproveProperty(int id)
    {
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (property == null)
        {
            return NotFound(new { message = "Property was not found." });
        }

        if (property.VerificationStatus != PropertyVerificationStatus.UnderReview)
        {
            return BadRequest(new { message = "Only properties under review can be approved." });
        }

        if (!TryGetAdminId(out var adminId))
        {
            return Unauthorized();
        }

        property.VerificationStatus = PropertyVerificationStatus.Approved;
        property.RejectionReason = null;
        property.VerifiedAt = DateTime.UtcNow;
        property.VerifiedByAdminId = adminId;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new
        {
            propertyId = property.Id,
            status = property.VerificationStatus.ToString(),
            property.VerifiedAt
        });
    }

    // PUT /api/admin/properties/{id}/reject
    [HttpPut("properties/{id:int}/reject")]
    public async Task<IActionResult> RejectProperty(
        int id,
        [FromBody] PropertyVerificationDecisionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return BadRequest(new { message = "A rejection reason is required." });
        }

        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (property == null)
        {
            return NotFound(new { message = "Property was not found." });
        }

        if (property.VerificationStatus != PropertyVerificationStatus.UnderReview)
        {
            return BadRequest(new { message = "Only properties under review can be rejected." });
        }

        if (!TryGetAdminId(out var adminId))
        {
            return Unauthorized();
        }

        property.VerificationStatus = PropertyVerificationStatus.Rejected;
        property.RejectionReason = request.RejectionReason.Trim();
        property.VerifiedAt = null;
        property.VerifiedByAdminId = adminId;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new
        {
            propertyId = property.Id,
            status = property.VerificationStatus.ToString(),
            property.RejectionReason
        });
    }

    // GET /api/admin/owners/profile-change-requests/pending
    [HttpGet("owners/profile-change-requests/pending")]
    public async Task<IActionResult> GetPendingOwnerProfileChangeRequests()
    {
        var requests = await _context.OwnerProfileChangeRequests
            .AsNoTracking()
            .Include(r => r.PropertyOwner)
                .ThenInclude(po => po!.User)
            .Where(r => r.Status == OwnerProfileChangeRequestStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new
            {
                requestId = r.Id,
                ownerId = r.PropertyOwnerId,
                userId = r.PropertyOwner!.UserId,
                currentFullName = r.PropertyOwner.User!.FullName,
                currentEmail = r.PropertyOwner.User.Email,
                currentMobile = r.PropertyOwner.User.Mobile,
                requestedFullName = r.RequestedFullName,
                requestedEmail = r.RequestedEmail,
                requestedMobile = r.RequestedMobile,
                status = r.Status.ToString(),
                createdAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    // PUT /api/admin/owners/profile-change-requests/{id:int}/approve
    [HttpPut("owners/profile-change-requests/{id:int}/approve")]
    public async Task<IActionResult> ApproveOwnerProfileChangeRequest(int id)
    {
        if (!TryGetAdminId(out var adminId))
        {
            return Unauthorized();
        }

        var profileRequest = await _context.OwnerProfileChangeRequests
            .Include(r => r.PropertyOwner)
                .ThenInclude(po => po!.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (profileRequest == null)
        {
            return NotFound(new { message = "Profile change request was not found." });
        }

        if (profileRequest.Status != OwnerProfileChangeRequestStatus.Pending)
        {
            return BadRequest(new { message = "Only pending profile change requests can be approved." });
        }

        var user = profileRequest.PropertyOwner?.User;
        if (user == null)
        {
            return NotFound(new { message = "Associated user record was not found." });
        }

        var reqEmail = profileRequest.RequestedEmail;
        var reqMobile = profileRequest.RequestedMobile;

        var hasDuplicate = await _context.Users.AnyAsync(u =>
            u.Id != user.Id &&
            ((reqEmail != null && u.Email != null && u.Email.ToLower() == reqEmail.ToLower()) ||
             (reqMobile != null && u.Mobile != null && u.Mobile == reqMobile)));

        if (hasDuplicate)
        {
            return Conflict(new { message = "Requested email or mobile is already in use by another user account." });
        }

        user.FullName = profileRequest.RequestedFullName.Trim();
        user.Email = reqEmail;
        user.Mobile = reqMobile;
        user.UpdatedAt = DateTime.UtcNow;

        profileRequest.Status = OwnerProfileChangeRequestStatus.Approved;
        profileRequest.RejectionReason = null;
        profileRequest.ReviewedByAdminId = adminId;
        profileRequest.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            requestId = profileRequest.Id,
            status = profileRequest.Status.ToString(),
            reviewedAt = profileRequest.ReviewedAt,
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Mobile
            }
        });
    }

    // PUT /api/admin/owners/profile-change-requests/{id:int}/reject
    [HttpPut("owners/profile-change-requests/{id:int}/reject")]
    public async Task<IActionResult> RejectOwnerProfileChangeRequest(
        int id,
        [FromBody] RejectProfileChangeRequestDto dto)
    {
        if (!TryGetAdminId(out var adminId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            return BadRequest(new { message = "A rejection reason is required." });
        }

        var profileRequest = await _context.OwnerProfileChangeRequests
            .Include(r => r.PropertyOwner)
                .ThenInclude(po => po!.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (profileRequest == null)
        {
            return NotFound(new { message = "Profile change request was not found." });
        }

        if (profileRequest.Status != OwnerProfileChangeRequestStatus.Pending)
        {
            return BadRequest(new { message = "Only pending profile change requests can be rejected." });
        }

        profileRequest.Status = OwnerProfileChangeRequestStatus.Rejected;
        profileRequest.RejectionReason = dto.RejectionReason.Trim();
        profileRequest.ReviewedByAdminId = adminId;
        profileRequest.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            requestId = profileRequest.Id,
            status = profileRequest.Status.ToString(),
            rejectionReason = profileRequest.RejectionReason,
            reviewedAt = profileRequest.ReviewedAt
        });
    }

    private bool TryGetAdminId(out int adminId)
    {
        return int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out adminId);
    }
}