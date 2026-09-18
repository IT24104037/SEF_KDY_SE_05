using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class PropertyVerificationTests
{
    [Fact]
    public async Task VerifiedOwner_CanSubmitProperty_AsUnderReviewWithProof()
    {
        await using var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreatePropertyAsync(101, CreateRequest());

        Assert.NotNull(result);
        Assert.Equal("UnderReview", result!.VerificationStatus);
        Assert.Single(context.PropertyVerificationDocuments);
    }

    [Fact]
    public async Task PropertySubmission_RequiresProof()
    {
        await using var context = CreateVerifiedOwnerContext();

        var request = CreateRequest();
        request.DocumentType = "";
        request.DocumentUrl = "";

        var result = await new PropertyService(context).CreatePropertyAsync(101, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task UnverifiedOwner_CannotSubmitProperty()
    {
        await using var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.PendingVerification
        });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreatePropertyAsync(101, CreateRequest());

        Assert.Null(result);
    }

    [Fact]
    public async Task UnapprovedProperty_CannotCreateUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Review Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.UnderReview
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-1"
        });

        Assert.False(result.Success);
    }

    [Fact]
    public async Task ApprovedProperty_CanCreateUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Approved Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-1"
        });

        Assert.True(result.Success);
    }

    [Fact]
    public async Task Dashboard_ExcludesUnapprovedPropertiesAndUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        context.Properties.AddRange(
            new Property
            {
                PropertyOwnerId = 1,
                Name = "Approved",
                Address = "1 Main Street",
                VerificationStatus = PropertyVerificationStatus.Approved
            },
            new Property
            {
                PropertyOwnerId = 1,
                Name = "Review",
                Address = "2 Main Street",
                VerificationStatus = PropertyVerificationStatus.UnderReview
            });
        await context.SaveChangesAsync();
        var approved = await context.Properties.SingleAsync(p => p.Name == "Approved");
        var review = await context.Properties.SingleAsync(p => p.Name == "Review");
        context.Units.AddRange(
            new Unit { PropertyId = approved.Id, UnitLabel = "A-1" },
            new Unit { PropertyId = review.Id, UnitLabel = "R-1" });
        await context.SaveChangesAsync();

        var dashboard = await new PropertyService(context).GetOwnerDashboardAsync(101);

        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard!.ActiveProperties);
        Assert.Equal(1, dashboard.ActiveUnits);
        Assert.Equal(1, dashboard.VacantUnits);
    }

    private static AppDbContext CreateVerifiedOwnerContext()
    {
        var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        context.SaveChanges();
        return context;
    }

    private static CreatePropertyDto CreateRequest() => new()
    {
        Name = "New Property",
        Address = "1 Main Street",
        DocumentType = "Ownership Proof",
        DocumentUrl = "https://example.test/proof.pdf"
    };

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
