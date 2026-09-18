using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class UnitSoftDeleteTests
{
    [Fact]
    public async Task SoftDeleteUnitAsync_RejectsActiveUnit()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var activeUnit = new Unit { PropertyId = property.Id, UnitLabel = "A-1" };
        context.Units.Add(activeUnit);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context)
            .SoftDeleteUnitAsync(101, property.Id, activeUnit.Id);

        Assert.False(result);
        Assert.False(activeUnit.IsDeleted);
    }

    [Fact]
    public async Task SoftDeleteUnitAsync_PreservesArchivedUnitAndHidesItFromUnitLists()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var archivedUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-4",
            IsArchived = true
        };
        context.Units.Add(archivedUnit);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var result = await service.SoftDeleteUnitAsync(101, property.Id, archivedUnit.Id);

        Assert.True(result);

        var persistedUnit = await context.Units.SingleAsync(u => u.Id == archivedUnit.Id);
        Assert.True(persistedUnit.IsDeleted);
        Assert.NotNull(persistedUnit.DeletedAt);
        Assert.Empty(await service.GetUnitsAsync(101, property.Id));
        Assert.Empty(await service.GetArchivedUnitsAsync(101, property.Id));

        var restoreResult = await service.RestoreUnitAsync(101, property.Id, archivedUnit.Id);
        Assert.False(restoreResult.Success);
    }

    [Fact]
    public async Task SoftDeletedUnitLabel_CanBeReusedButDuplicateActiveLabelIsRejected()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var deletedUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-4",
            IsArchived = true,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };
        context.Units.Add(deletedUnit);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var createResult = await service.CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-4"
        });

        Assert.True(createResult.Success);
        Assert.NotNull(createResult.Unit);
        Assert.False(createResult.Unit!.IsArchived);

        var duplicateResult = await service.CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-4"
        });

        Assert.False(duplicateResult.Success);
    }

    [Fact]
    public async Task SoftDeleteUnitAsync_RequiresOwningPropertyOwner()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 2,
            UserId = 202,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        var archivedUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-4",
            IsArchived = true
        };
        context.Units.Add(archivedUnit);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context)
            .SoftDeleteUnitAsync(202, property.Id, archivedUnit.Id);

        Assert.False(result);
        Assert.False(archivedUnit.IsDeleted);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<Property> AddVerifiedOwnerAndPropertyAsync(
        AppDbContext context,
        int ownerId,
        int userId)
    {
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = ownerId,
            UserId = userId,
            VerificationStatus = OwnerVerificationStatus.Verified
        });

        var property = new Property
        {
            PropertyOwnerId = ownerId,
            Name = "Property A",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        return property;
    }
}
