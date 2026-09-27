using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Tests;

public class OwnerVerificationWorkflowTests
{
    private static ControllerContext CreateControllerContext(int userId)
    {
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                }))
            }
        };
    }

    private static OwnerReapplyRequestDto CreateValidReapplyDto()
    {
        return new OwnerReapplyRequestDto
        {
            FullName = "Updated Owner",
            Email = "owner@example.com",
            Mobile = "0771234567",
            PropertyName = "Updated Property",
            PropertyAddress = "2 Main Street",
            DocumentType = "Updated deed",
            DocumentUrl = "https://example.com/new-proof"
        };
    }

    [Fact]
    public async Task RejectedOwnerCanReapplyWithoutCreatingDuplicateRecords()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var result = await controller.Reapply(CreateValidReapplyDto());

        var okResult = Assert.IsType<OkObjectResult>(result);
        var owner = await context.PropertyOwners.Include(item => item.User).SingleAsync();
        var property = await context.Properties.SingleAsync();
        Assert.Equal(OwnerVerificationStatus.PendingVerification, owner.VerificationStatus);
        Assert.Null(owner.RejectionReason);
        Assert.Equal("Updated Owner", owner.User!.FullName);
        Assert.Equal("Updated Property", property.Name);
        Assert.Single(await context.PropertyOwners.ToListAsync());
        Assert.Single(await context.Properties.ToListAsync());
        Assert.Equal("https://example.com/new-proof",
            (await context.OwnerVerificationDocuments.SingleAsync()).DocumentUrl);
    }

    [Fact]
    public async Task Reapply_MissingEmail_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Email = "";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reapply_InvalidEmail_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Email = "invalid-email-format";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reapply_MissingMobile_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Mobile = "";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reapply_NonNumericMobile_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Mobile = "077123456A";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reapply_MobileFewerThan10Digits_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Mobile = "077123456";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reapply_MobileMoreThan10Digits_ReturnsBadRequest()
    {
        await using var context = CreateContext();
        var controller = new OwnerVerificationController(null!, context)
        {
            ControllerContext = CreateControllerContext(10)
        };

        var dto = CreateValidReapplyDto();
        dto.Mobile = "07712345678";

        var result = await controller.Reapply(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Users.Add(new User
        {
            Id = 10,
            FullName = "Owner",
            Email = "owner@example.com",
            Mobile = "0771234567",
            RoleId = 2
        });
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 10,
            VerificationStatus = OwnerVerificationStatus.Rejected,
            RejectionReason = "Proof is unclear."
        });
        context.Properties.Add(new Property
        {
            Id = 1,
            PropertyOwnerId = 1,
            Name = "Original Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Proof is unclear."
        });
        context.OwnerVerificationDocuments.Add(new OwnerVerificationDocument
        {
            Id = 1,
            PropertyOwnerId = 1,
            DocumentType = "Old deed",
            DocumentUrl = "https://example.com/old-proof"
        });
        context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            Id = 1,
            PropertyId = 1,
            DocumentType = "Old deed",
            DocumentUrl = "https://example.com/old-proof"
        });
        context.SaveChanges();
        return context;
    }
}