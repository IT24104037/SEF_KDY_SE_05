using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Owners;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Tests;

public class OwnerProfileChangeRequestTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static ControllerContext CreateControllerContext(int userId, string role = "PropertyOwner")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
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
    public async Task VerifiedOwner_CanCreateProfileChangeRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "John Owner", Email = "john@example.com", Mobile = "0771234567", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user.Id)
        };

        var requestDto = new CreateOwnerProfileChangeRequestDto
        {
            FullName = "Johnathan Owner",
            Email = "johnathan@example.com",
            Mobile = "0779998887"
        };

        var result = await controller.CreateProfileChangeRequest(requestDto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<OwnerProfileChangeRequestResponseDto>(okResult.Value);
        Assert.Equal("Johnathan Owner", response.RequestedFullName);
        Assert.Equal("johnathan@example.com", response.RequestedEmail);
        Assert.Equal("0779998887", response.RequestedMobile);
        Assert.Equal("Pending", response.Status);

        var savedRequest = await context.OwnerProfileChangeRequests.SingleOrDefaultAsync();
        Assert.NotNull(savedRequest);
        Assert.Equal(owner.Id, savedRequest.PropertyOwnerId);
        Assert.Equal(OwnerProfileChangeRequestStatus.Pending, savedRequest.Status);
    }

    [Fact]
    public async Task UserInformation_IsNotImmediatelyChanged()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "Original Name", Email = "original@example.com", Mobile = "0770000000", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user.Id)
        };

        var requestDto = new CreateOwnerProfileChangeRequestDto
        {
            FullName = "Changed Name",
            Email = "changed@example.com",
            Mobile = "0771111111"
        };

        await controller.CreateProfileChangeRequest(requestDto);

        var dbUser = await context.Users.FindAsync(user.Id);
        Assert.NotNull(dbUser);
        Assert.Equal("Original Name", dbUser.FullName);
        Assert.Equal("original@example.com", dbUser.Email);
        Assert.Equal("0770000000", dbUser.Mobile);
    }

    [Fact]
    public async Task PropertyOwnerVerificationStatus_RemainsVerified()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "John Owner", Email = "john@example.com", Mobile = "0771234567", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user.Id)
        };

        await controller.CreateProfileChangeRequest(new CreateOwnerProfileChangeRequestDto
        {
            FullName = "New Name",
            Email = "new@example.com"
        });

        var dbOwner = await context.PropertyOwners.FindAsync(owner.Id);
        Assert.NotNull(dbOwner);
        Assert.Equal(OwnerVerificationStatus.Verified, dbOwner.VerificationStatus);
    }

    [Fact]
    public async Task Owner_CanContinueDashboardAccess_WhileRequestIsPending()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "John Owner", Email = "john@example.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var pendingRequest = new OwnerProfileChangeRequest
        {
            Id = 100,
            PropertyOwnerId = owner.Id,
            RequestedFullName = "Pending Name",
            RequestedEmail = "pending@example.com",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        context.OwnerProfileChangeRequests.Add(pendingRequest);
        await context.SaveChangesAsync();

        var profileController = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user.Id)
        };

        var getResult = await profileController.GetMyProfileChangeRequest();
        var okResult = Assert.IsType<OkObjectResult>(getResult);
        var response = Assert.IsType<OwnerProfileChangeRequestResponseDto>(okResult.Value);
        Assert.Equal("Pending", response.Status);
        Assert.Equal("Pending Name", response.RequestedFullName);

        var dbOwner = await context.PropertyOwners.FindAsync(owner.Id);
        Assert.NotNull(dbOwner);
        Assert.Equal(OwnerVerificationStatus.Verified, dbOwner.VerificationStatus);
    }

    [Fact]
    public async Task DuplicateEmail_IsRejected()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user1 = new User { Id = 1, FullName = "Owner 1", Email = "owner1@example.com", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var user2 = new User { Id = 2, FullName = "Owner 2", Email = "owner2@example.com", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 20, UserId = 2, VerificationStatus = OwnerVerificationStatus.Verified };
        context.Users.AddRange(user1, user2);
        context.PropertyOwners.AddRange(owner1, owner2);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user1.Id)
        };

        var requestDto = new CreateOwnerProfileChangeRequestDto
        {
            FullName = "Owner 1 Updated",
            Email = "OWNER2@EXAMPLE.COM"
        };

        var result = await controller.CreateProfileChangeRequest(requestDto);
        Assert.IsType<ConflictObjectResult>(result);

        var requests = await context.OwnerProfileChangeRequests.ToListAsync();
        Assert.Empty(requests);
    }

    [Fact]
    public async Task DuplicateMobile_IsRejected()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user1 = new User { Id = 1, FullName = "Owner 1", Mobile = "0771111111", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var user2 = new User { Id = 2, FullName = "Owner 2", Mobile = "0772222222", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 20, UserId = 2, VerificationStatus = OwnerVerificationStatus.Verified };
        context.Users.AddRange(user1, user2);
        context.PropertyOwners.AddRange(owner1, owner2);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user1.Id)
        };

        var requestDto = new CreateOwnerProfileChangeRequestDto
        {
            FullName = "Owner 1 Updated",
            Mobile = "0772222222"
        };

        var result = await controller.CreateProfileChangeRequest(requestDto);
        Assert.IsType<ConflictObjectResult>(result);

        var requests = await context.OwnerProfileChangeRequests.ToListAsync();
        Assert.Empty(requests);
    }

    [Fact]
    public async Task Owner_CannotCreateSecondPendingRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user = new User { Id = 1, FullName = "Owner 1", Email = "owner1@example.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var existingRequest = new OwnerProfileChangeRequest
        {
            Id = 1,
            PropertyOwnerId = owner.Id,
            RequestedFullName = "Pending Change 1",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        context.PropertyOwners.Add(owner);
        context.OwnerProfileChangeRequests.Add(existingRequest);
        await context.SaveChangesAsync();

        var controller = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user.Id)
        };

        var requestDto = new CreateOwnerProfileChangeRequestDto
        {
            FullName = "Pending Change 2",
            Email = "newemail@example.com"
        };

        var result = await controller.CreateProfileChangeRequest(requestDto);
        Assert.IsType<BadRequestObjectResult>(result);

        var requestsCount = await context.OwnerProfileChangeRequests.CountAsync();
        Assert.Equal(1, requestsCount);
    }

    [Fact]
    public async Task OneOwner_CannotAccessAnotherOwnersRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var user1 = new User { Id = 1, FullName = "Owner 1", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.Verified };
        var user2 = new User { Id = 2, FullName = "Owner 2", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 20, UserId = 2, VerificationStatus = OwnerVerificationStatus.Verified };
        
        var owner1Request = new OwnerProfileChangeRequest
        {
            Id = 50,
            PropertyOwnerId = owner1.Id,
            RequestedFullName = "Owner 1 Private Request",
            Status = OwnerProfileChangeRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(user1, user2);
        context.PropertyOwners.AddRange(owner1, owner2);
        context.OwnerProfileChangeRequests.Add(owner1Request);
        await context.SaveChangesAsync();

        var controllerForOwner2 = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(user2.Id)
        };

        var getResult = await controllerForOwner2.GetMyProfileChangeRequest();
        Assert.IsType<NotFoundObjectResult>(getResult);
    }

    [Fact]
    public async Task UnauthenticatedOrNonOwnerAccess_IsRejected()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var unverifiedUser = new User { Id = 1, FullName = "Unverified Owner", RoleId = 2 };
        var unverifiedOwner = new PropertyOwner { Id = 10, UserId = 1, VerificationStatus = OwnerVerificationStatus.PendingVerification };
        context.Users.Add(unverifiedUser);
        context.PropertyOwners.Add(unverifiedOwner);
        await context.SaveChangesAsync();

        // Scenario 9a: Invalid / Missing User Claim
        var controllerUnauth = new OwnerProfileController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var unauthResult = await controllerUnauth.CreateProfileChangeRequest(new CreateOwnerProfileChangeRequestDto { FullName = "Test" });
        Assert.IsType<UnauthorizedResult>(unauthResult);

        // Scenario 9b: Unverified Owner attempting request
        var controllerUnverified = new OwnerProfileController(context)
        {
            ControllerContext = CreateControllerContext(unverifiedUser.Id)
        };

        var unverifiedResult = await controllerUnverified.CreateProfileChangeRequest(new CreateOwnerProfileChangeRequestDto { FullName = "Test" });
        Assert.IsType<BadRequestObjectResult>(unverifiedResult);
    }
}
