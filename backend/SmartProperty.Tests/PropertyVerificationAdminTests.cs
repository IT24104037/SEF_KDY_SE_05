using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Tests;

public class PropertyVerificationAdminTests
{
    [Fact]
    public async Task AdminCanApproveProperty()
    {
        await using var context = CreateContext(PropertyVerificationStatus.UnderReview);
        var controller = CreateController(context);

        var result = await controller.ApproveProperty(1);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(PropertyVerificationStatus.Approved,
            (await context.Properties.SingleAsync()).VerificationStatus);
    }

    [Fact]
    public async Task RejectPropertyRequiresReason()
    {
        await using var context = CreateContext(PropertyVerificationStatus.UnderReview);
        var controller = CreateController(context);

        var result = await controller.RejectProperty(1, new PropertyVerificationDecisionDto());

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(PropertyVerificationStatus.UnderReview,
            (await context.Properties.SingleAsync()).VerificationStatus);
    }

    [Fact]
    public async Task AdminCanRejectPropertyWithReason()
    {
        await using var context = CreateContext(PropertyVerificationStatus.UnderReview);
        var controller = CreateController(context);

        var result = await controller.RejectProperty(1,
            new PropertyVerificationDecisionDto { RejectionReason = "Proof is unclear." });

        Assert.IsType<OkObjectResult>(result);
        var property = await context.Properties.SingleAsync();
        Assert.Equal(PropertyVerificationStatus.Rejected, property.VerificationStatus);
        Assert.Equal("Proof is unclear.", property.RejectionReason);
    }

    private static AdminController CreateController(AppDbContext context)
    {
        var controller = new AdminController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "999")
                    }))
                }
            }
        };
        return controller;
    }

    private static AppDbContext CreateContext(PropertyVerificationStatus status)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Properties.Add(new Property
        {
            Id = 1,
            PropertyOwnerId = 1,
            Name = "Review Property",
            Address = "1 Main Street",
            VerificationStatus = status,
            SubmittedAt = DateTime.UtcNow
        });
        context.SaveChanges();
        return context;
    }
}
