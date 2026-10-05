using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Admin;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Tests;

public class AdminOwnerProfileRequestTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static ControllerContext CreateAdminControllerContext(int adminUserId = 99)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, adminUserId.ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        };

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };
    }

    [Fact]
    public async Task Admin_CanFetchPendingProfileChangeRequests()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "Current Owner Name", Email = "current@example.com", Mobile = "0771111111", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var request = new OwnerProfileChangeRequest
        {
            Id = 100,
            PropertyOwnerId = owner.Id,
            RequestedFullName = "Requested Owner Name",
            RequestedEmail = "requested@example.com",
            RequestedMobile = "0779999999",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        context.OwnerProfileChangeRequests.Add(request);
        await context.SaveChangesAsync();

        var controller = new AdminController(context)
        {
            ControllerContext = CreateAdminControllerContext()
        };

        var result = await controller.GetPendingOwnerProfileChangeRequests();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var requestsList = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Single(requestsList);
    }

    [Fact]
    public async Task AdminApprove_UpdatesUserRecord_AndRequestStatusToApproved()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "Old Name", Email = "old@example.com", Mobile = "0770000000", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var request = new OwnerProfileChangeRequest
        {
            Id = 100,
            PropertyOwnerId = owner.Id,
            RequestedFullName = "New Approved Name",
            RequestedEmail = "approved@example.com",
            RequestedMobile = "0779999999",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        context.OwnerProfileChangeRequests.Add(request);
        await context.SaveChangesAsync();

        var controller = new AdminController(context)
        {
            ControllerContext = CreateAdminControllerContext(adminUserId: 99)
        };

        var result = await controller.ApproveOwnerProfileChangeRequest(request.Id);
        Assert.IsType<OkObjectResult>(result);

        // Verify request entity updated
        var dbRequest = await context.OwnerProfileChangeRequests.FindAsync(request.Id);
        Assert.NotNull(dbRequest);
        Assert.Equal(OwnerProfileChangeRequestStatus.Approved, dbRequest.Status);
        Assert.Equal(99, dbRequest.ReviewedByAdminId);
        Assert.NotNull(dbRequest.ReviewedAt);

        // Verify User entity updated
        var dbUser = await context.Users.FindAsync(user.Id);
        Assert.NotNull(dbUser);
        Assert.Equal("New Approved Name", dbUser.FullName);
        Assert.Equal("approved@example.com", dbUser.Email);
        Assert.Equal("0779999999", dbUser.Mobile);

        // Verify PropertyOwner VerificationStatus remains Verified
        var dbOwner = await context.PropertyOwners.FindAsync(owner.Id);
        Assert.NotNull(dbOwner);
        Assert.Equal(OwnerVerificationStatus.Verified, dbOwner.VerificationStatus);
    }

    [Fact]
    public async Task AdminReject_RequiresReason_UpdatesRequestStatusToRejected_AndLeavesUserUnchanged()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "Original Name", Email = "original@example.com", Mobile = "0770000000", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var request = new OwnerProfileChangeRequest
        {
            Id = 100,
            PropertyOwnerId = owner.Id,
            RequestedFullName = "Rejected Name",
            RequestedEmail = "rejected@example.com",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        context.OwnerProfileChangeRequests.Add(request);
        await context.SaveChangesAsync();

        var controller = new AdminController(context)
        {
            ControllerContext = CreateAdminControllerContext(adminUserId: 99)
        };

        // 1. Missing rejection reason should return BadRequest
        var emptyReasonResult = await controller.RejectOwnerProfileChangeRequest(request.Id, new RejectProfileChangeRequestDto { RejectionReason = "  " });
        Assert.IsType<BadRequestObjectResult>(emptyReasonResult);

        // 2. Valid rejection
        var rejectResult = await controller.RejectOwnerProfileChangeRequest(request.Id, new RejectProfileChangeRequestDto { RejectionReason = "Invalid documents provided." });
        Assert.IsType<OkObjectResult>(rejectResult);

        // Verify request updated
        var dbRequest = await context.OwnerProfileChangeRequests.FindAsync(request.Id);
        Assert.NotNull(dbRequest);
        Assert.Equal(OwnerProfileChangeRequestStatus.Rejected, dbRequest.Status);
        Assert.Equal("Invalid documents provided.", dbRequest.RejectionReason);
        Assert.Equal(99, dbRequest.ReviewedByAdminId);
        Assert.NotNull(dbRequest.ReviewedAt);

        // Verify User entity left UNCHANGED
        var dbUser = await context.Users.FindAsync(user.Id);
        Assert.NotNull(dbUser);
        Assert.Equal("Original Name", dbUser.FullName);
        Assert.Equal("original@example.com", dbUser.Email);
        Assert.Equal("0770000000", dbUser.Mobile);

        // Verify PropertyOwner VerificationStatus remains Verified
        var dbOwner = await context.PropertyOwners.FindAsync(owner.Id);
        Assert.NotNull(dbOwner);
        Assert.Equal(OwnerVerificationStatus.Verified, dbOwner.VerificationStatus);
    }

    [Fact]
    public async Task AdminApprove_DuplicateEmailOrMobileConflict_ReturnsConflict()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user1 = new User { Id = 1, FullName = "Owner 1", Email = "owner1@example.com", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var user2 = new User { Id = 2, FullName = "Owner 2", Email = "conflict@example.com", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 20, UserId = 2, VerificationStatus = OwnerVerificationStatus.Verified };

        var request = new OwnerProfileChangeRequest
        {
            Id = 100,
            PropertyOwnerId = owner1.Id,
            RequestedFullName = "Owner 1 Updated",
            RequestedEmail = "conflict@example.com", // Conflict with User 2
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(user1, user2);
        context.PropertyOwners.AddRange(owner1, owner2);
        context.OwnerProfileChangeRequests.Add(request);
        await context.SaveChangesAsync();

        var controller = new AdminController(context)
        {
            ControllerContext = CreateAdminControllerContext()
        };

        var result = await controller.ApproveOwnerProfileChangeRequest(request.Id);
        Assert.IsType<ConflictObjectResult>(result);

        // Verify user 1 email was NOT updated
        var dbUser1 = await context.Users.FindAsync(user1.Id);
        Assert.NotNull(dbUser1);
        Assert.Equal("owner1@example.com", dbUser1.Email);

        // Verify request remains Pending
        var dbRequest = await context.OwnerProfileChangeRequests.FindAsync(request.Id);
        Assert.NotNull(dbRequest);
        Assert.Equal(OwnerProfileChangeRequestStatus.Pending, dbRequest.Status);
    }

    [Fact]
    public async Task NonAdminAccess_IsRejected()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var controller = new AdminController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext() // No user identity claims
            }
        };

        var result = await controller.ApproveOwnerProfileChangeRequest(1);
        Assert.IsType<UnauthorizedResult>(result);
    }
}
