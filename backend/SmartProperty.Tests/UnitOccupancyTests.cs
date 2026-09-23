using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class UnitOccupancyTests
{
    [Fact]
    public async Task GetUnitsAsync_VacantUnit_ReturnsVacantStatusAndNullTenantInfo()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "101" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var units = await service.GetUnitsAsync(101, property.Id);

        var resultUnit = Assert.Single(units);
        Assert.Equal("Vacant", resultUnit.OccupancyStatus);
        Assert.Null(resultUnit.CurrentTenantId);
        Assert.Null(resultUnit.CurrentTenantName);
        Assert.Null(resultUnit.ActiveTenancyId);
    }

    [Fact]
    public async Task GetUnitsAsync_OccupiedUnit_ReturnsOccupiedStatusAndTenantInfo()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "102" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "John Doe",
            MobileNumber = "+1234567890",
            Email = "john@example.com",
            IsActive = true
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var tenancy = new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit.Id,
            StartDate = DateTime.UtcNow,
            Status = TenancyStatus.Active
        };
        context.Tenancies.Add(tenancy);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var units = await service.GetUnitsAsync(101, property.Id);

        var resultUnit = Assert.Single(units);
        Assert.Equal("Occupied", resultUnit.OccupancyStatus);
        Assert.Equal(tenant.Id, resultUnit.CurrentTenantId);
        Assert.Equal("John Doe", resultUnit.CurrentTenantName);
        Assert.Equal(tenancy.Id, resultUnit.ActiveTenancyId);
    }

    [Fact]
    public async Task GetUnitsAsync_MultipleUnits_ReturnsMixedOccupancyStates()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit1 = new Unit { PropertyId = property.Id, UnitLabel = "A-1" };
        var unit2 = new Unit { PropertyId = property.Id, UnitLabel = "A-2" };
        context.Units.AddRange(unit1, unit2);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit1.Id,
            FullName = "Alice Smith",
            MobileNumber = "+1987654321",
            IsActive = true
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        context.Tenancies.Add(new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit1.Id,
            StartDate = DateTime.UtcNow,
            Status = TenancyStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var units = await service.GetUnitsAsync(101, property.Id);

        Assert.Equal(2, units.Count);
        var res1 = units.First(u => u.Id == unit1.Id);
        var res2 = units.First(u => u.Id == unit2.Id);

        Assert.Equal("Occupied", res1.OccupancyStatus);
        Assert.Equal("Alice Smith", res1.CurrentTenantName);

        Assert.Equal("Vacant", res2.OccupancyStatus);
        Assert.Null(res2.CurrentTenantName);
    }

    [Fact]
    public async Task ArchiveUnitAsync_OccupiedUnit_RejectsArchiving()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "201" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "Bob Brown",
            MobileNumber = "+1122334455"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        context.Tenancies.Add(new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit.Id,
            StartDate = DateTime.UtcNow,
            Status = TenancyStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var result = await service.ArchiveUnitAsync(101, property.Id, unit.Id);

        Assert.False(result);
        var dbUnit = await context.Units.FindAsync(unit.Id);
        Assert.False(dbUnit!.IsArchived);
    }

    [Fact]
    public async Task SoftDeleteUnitAsync_OccupiedUnit_RejectsSoftDelete()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "202", IsArchived = true };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "Charlie Davis",
            MobileNumber = "+1555666777"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        context.Tenancies.Add(new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit.Id,
            StartDate = DateTime.UtcNow,
            Status = TenancyStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var result = await service.SoftDeleteUnitAsync(101, property.Id, unit.Id);

        Assert.False(result);
        var dbUnit = await context.Units.FindAsync(unit.Id);
        Assert.False(dbUnit!.IsDeleted);
    }

    [Fact]
    public async Task EndTenancy_ChangesUnitToVacant_AndPreservesHistory()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "301" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "David Evans",
            MobileNumber = "+1999888777"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var tenancy = new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit.Id,
            StartDate = DateTime.UtcNow.AddMonths(-6),
            Status = TenancyStatus.Active
        };
        context.Tenancies.Add(tenancy);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);

        // Verify initially occupied
        var unitsBefore = await service.GetUnitsAsync(101, property.Id);
        Assert.Equal("Occupied", Assert.Single(unitsBefore).OccupancyStatus);

        // End the tenancy directly in DB (as TenancyService.EndTenancyAsync does)
        tenancy.Status = TenancyStatus.Ended;
        tenancy.EndDate = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Verify now vacant
        var unitsAfter = await service.GetUnitsAsync(101, property.Id);
        var vacantUnit = Assert.Single(unitsAfter);
        Assert.Equal("Vacant", vacantUnit.OccupancyStatus);
        Assert.Null(vacantUnit.CurrentTenantId);

        // Verify tenancy record is preserved in database
        var historicTenancy = await context.Tenancies.FindAsync(tenancy.Id);
        Assert.NotNull(historicTenancy);
        Assert.Equal(TenancyStatus.Ended, historicTenancy!.Status);
        Assert.NotNull(historicTenancy.EndDate);

        // Verify unit can now be archived safely
        var archiveResult = await service.ArchiveUnitAsync(101, property.Id, unit.Id);
        Assert.True(archiveResult);
    }

    [Fact]
    public async Task GetUnitsAsync_EnforcesOwnerIsolation()
    {
        await using var context = CreateContext();
        var prop1 = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 2,
            UserId = 202,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        await context.SaveChangesAsync();

        var unit = new Unit { PropertyId = prop1.Id, UnitLabel = "401" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        
        // Owner 202 querying Owner 101's property should get empty list
        var result = await service.GetUnitsAsync(202, prop1.Id);
        Assert.Empty(result);
    }

    [Fact]
    public async Task CreateTenancyAsync_WithFutureEndDate_CreatesActiveTenancyAndMarksUnitOccupied()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);
        var unit = new Unit { PropertyId = property.Id, UnitLabel = "A-1" };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "John Silva",
            MobileNumber = "+123456789",
            IsActive = true
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var repository = new SmartProperty.Api.Repositories.Implementations.TenancyRepository(context);
        var pinGen = new SmartProperty.Api.Services.ActivationPinGenerator();
        var tenancyService = new TenancyService(repository, pinGen);

        var dto = new SmartProperty.Api.DTOs.Tenancies.CreateTenancyDto
        {
            TenantId = tenant.Id,
            UnitId = unit.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30)
        };

        var tenancyResponse = await tenancyService.CreateTenancyAsync(dto, 101);

        Assert.Equal(TenancyStatus.Active, tenancyResponse.Status);

        var propertyService = new PropertyService(context);
        var units = await propertyService.GetUnitsAsync(101, property.Id);

        var occupiedUnit = Assert.Single(units);
        Assert.Equal("Occupied", occupiedUnit.OccupancyStatus);
        Assert.Equal("John Silva", occupiedUnit.CurrentTenantName);
        Assert.Equal(tenancyResponse.Id, occupiedUnit.ActiveTenancyId);
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
            Name = "Property " + ownerId,
            Address = "100 Main St",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        return property;
    }
}
