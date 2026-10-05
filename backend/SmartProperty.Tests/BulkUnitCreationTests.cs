using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class BulkUnitCreationTests
{
    [Fact]
    public async Task CreateBulkUnitsAsync_ValidOwnerAndProperty_CreatesAllUnitsSuccessfully()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "A-1", Description = "Unit 1" },
                new() { UnitLabel = "A-2", Description = "Unit 2" },
                new() { UnitLabel = "A-3", Description = "Unit 3" },
                new() { UnitLabel = "A-4", Description = "Unit 4" },
                new() { UnitLabel = "A-5", Description = "Unit 5" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.True(result.Success);
        Assert.Equal(5, result.Units.Count);
        Assert.Null(result.ErrorMessage);

        var dbUnits = await context.Units
            .Where(u => u.PropertyId == property.Id)
            .OrderBy(u => u.UnitLabel)
            .ToListAsync();

        Assert.Equal(5, dbUnits.Count);
        Assert.Equal("A-1", dbUnits[0].UnitLabel);
        Assert.Equal("A-5", dbUnits[4].UnitLabel);
        Assert.All(dbUnits, u =>
        {
            Assert.False(u.IsArchived);
            Assert.False(u.IsDeleted);
        });
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_DuplicateLabelsInSameRequest_RejectsAndCreatesNoUnits()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "A-1" },
                new() { UnitLabel = "A-1" },
                new() { UnitLabel = "A-2" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("Duplicate unit labels", result.ErrorMessage);

        var dbUnitsCount = await context.Units.CountAsync(u => u.PropertyId == property.Id);
        Assert.Equal(0, dbUnitsCount);
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_ExistingActiveUnitLabel_RejectsAndLeavesExistingUnitUnchanged()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var existingUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-1",
            IsArchived = false,
            IsDeleted = false
        };
        context.Units.Add(existingUnit);
        await context.SaveChangesAsync();

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "A-1" },
                new() { UnitLabel = "A-2" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("already exist", result.ErrorMessage);

        var dbUnits = await context.Units.Where(u => u.PropertyId == property.Id).ToListAsync();
        Assert.Single(dbUnits);
        Assert.Equal("A-1", dbUnits[0].UnitLabel);
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_ArchivedUnitLabel_AllowsLabelReuseAndCreatesNewActiveUnit()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var archivedUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-1",
            IsArchived = true,
            IsDeleted = false
        };
        context.Units.Add(archivedUnit);
        await context.SaveChangesAsync();

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "A-1" },
                new() { UnitLabel = "A-2" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.True(result.Success);
        Assert.Equal(2, result.Units.Count);

        var activeUnits = await context.Units
            .Where(u => u.PropertyId == property.Id && !u.IsArchived && !u.IsDeleted)
            .ToListAsync();

        Assert.Equal(2, activeUnits.Count);
        Assert.Contains(activeUnits, u => u.UnitLabel == "A-1" && !u.IsArchived && !u.IsDeleted);
        Assert.Contains(activeUnits, u => u.UnitLabel == "A-2" && !u.IsArchived && !u.IsDeleted);
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_SoftDeletedUnitLabel_AllowsLabelReuse()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var softDeletedUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "A-1",
            IsArchived = true,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow
        };
        context.Units.Add(softDeletedUnit);
        await context.SaveChangesAsync();

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "A-1" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.True(result.Success);
        Assert.Single(result.Units);

        var activeUnits = await context.Units
            .Where(u => u.PropertyId == property.Id && !u.IsArchived && !u.IsDeleted)
            .ToListAsync();

        Assert.Single(activeUnits);
        Assert.Equal("A-1", activeUnits[0].UnitLabel);
        Assert.False(activeUnits[0].IsArchived);
        Assert.False(activeUnits[0].IsDeleted);
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_WrongOwnerProperty_RejectsAndCreatesNoUnits()
    {
        await using var context = CreateContext();

        // Owner A (userId 101)
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });

        // Owner B (userId 202) and Property belonging to Owner B
        var propertyB = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 2, userId: 202);

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "B-1" }
            }
        };

        var service = new PropertyService(context);

        // Owner A attempting to create units in Owner B's property
        var result = await service.CreateBulkUnitsAsync(101, propertyB.Id, request);

        Assert.False(result.Success);
        Assert.Equal("Property not found.", result.ErrorMessage);

        var dbUnitsCount = await context.Units.CountAsync(u => u.PropertyId == propertyB.Id);
        Assert.Equal(0, dbUnitsCount);
    }

    [Fact]
    public async Task CreateBulkUnitsAsync_UnverifiedOwner_RejectsAndCreatesNoUnits()
    {
        await using var context = CreateContext();

        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.PendingVerification
        });

        var property = new Property
        {
            Id = 10,
            PropertyOwnerId = 1,
            Name = "Pending Owner Property",
            Address = "123 Main St",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var request = new CreateBulkUnitsDto
        {
            Units = new List<CreateUnitDto>
            {
                new() { UnitLabel = "P-1" }
            }
        };

        var service = new PropertyService(context);
        var result = await service.CreateBulkUnitsAsync(101, property.Id, request);

        Assert.False(result.Success);
        Assert.Contains("verified", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);

        var dbUnitsCount = await context.Units.CountAsync(u => u.PropertyId == property.Id);
        Assert.Equal(0, dbUnitsCount);
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
            Name = "Test Property",
            Address = "100 Main St",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        return property;
    }
}
