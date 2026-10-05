using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Auth;
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
            verifiedAt = owner.VerifiedAt
        });
    }
}