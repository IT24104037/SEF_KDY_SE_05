using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class OwnerDashboardTests
{
    [Fact]
    public async Task GetOwnerDashboardAsync_MixedUnitAndPropertyStates_ReturnsAccurateCounts()
    {
        await using var context = CreateContext();

        // Verified Owner 1 (userId = 101, ownerId = 1)
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });

        // Property 1: Active Approved
        var activeProperty = new Property
        {
            PropertyOwnerId = 1,
            Name = "Active Villa",
            Address = "100 Main St",
            VerificationStatus = PropertyVerificationStatus.Approved,
            IsArchived = false
        };

        // Property 2: Archived Property
        var archivedProperty = new Property
        {
            PropertyOwnerId = 1,
            Name = "Archived Manor",
            Address = "200 Old Rd",
            VerificationStatus = PropertyVerificationStatus.Approved,
            IsArchived = true
        };

        context.Properties.AddRange(activeProperty, archivedProperty);
        await context.SaveChangesAsync();

        // Active Property Units:
        // Unit 1: Active Occupied
        var unitOccupied = new Unit { PropertyId = activeProperty.Id, UnitLabel = "101", IsArchived = false, IsDeleted = false };
        // Unit 2: Active Vacant
        var unitVacant = new Unit { PropertyId = activeProperty.Id, UnitLabel = "102", IsArchived = false, IsDeleted = false };
        // Unit 3: Archived Unit
        var unitArchived = new Unit { PropertyId = activeProperty.Id, UnitLabel = "103", IsArchived = true, IsDeleted = false };
        // Unit 4: Soft-Deleted Unit
        var unitSoftDeleted = new Unit { PropertyId = activeProperty.Id, UnitLabel = "104", IsArchived = true, IsDeleted = true, DeletedAt = DateTime.UtcNow };

        context.Units.AddRange(unitOccupied, unitVacant, unitArchived, unitSoftDeleted);
        await context.SaveChangesAsync();

        // Active Tenancy for Unit 1 (Occupied)
        var tenant = new Tenant
        {
            PropertyId = activeProperty.Id,
            UnitId = unitOccupied.Id,
            FullName = "John Doe",
            MobileNumber = "+123456789"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        context.Tenancies.Add(new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unitOccupied.Id,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            Status = TenancyStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new PropertyService(context);
        var dashboard = await service.GetOwnerDashboardAsync(101);

        Assert.NotNull(dashboard);
        Assert.Equal(2, dashboard!.TotalProperties);
        Assert.Equal(1, dashboard.ActiveProperties);
        Assert.Equal(1, dashboard.ArchivedProperties);

        Assert.Equal(3, dashboard.TotalUnits);       // unitOccupied, unitVacant, unitArchived (soft-deleted excluded)
        Assert.Equal(2, dashboard.ActiveUnits);      // unitOccupied, unitVacant
        Assert.Equal(1, dashboard.ArchivedUnits);    // unitArchived
        Assert.Equal(1, dashboard.OccupiedUnits);    // unitOccupied
        Assert.Equal(1, dashboard.VacantUnits);      // unitVacant
    }

    [Fact]
    public async Task GetOwnerDashboardAsync_EnforcesOwnerIsolation()
    {
        await using var context = CreateContext();

        // Owner A (userId 101)
        context.PropertyOwners.Add(new PropertyOwner { Id = 1, UserId = 101, VerificationStatus = OwnerVerificationStatus.Verified });
        var propA = new Property { PropertyOwnerId = 1, Name = "Owner A Villa", Address = "1 Beach Rd", VerificationStatus = PropertyVerificationStatus.Approved };
        context.Properties.Add(propA);
        await context.SaveChangesAsync();

        var unitA = new Unit { PropertyId = propA.Id, UnitLabel = "A-1" };
        context.Units.Add(unitA);
        await context.SaveChangesAsync();

        // Owner B (userId 202)
        context.PropertyOwners.Add(new PropertyOwner { Id = 2, UserId = 202, VerificationStatus = OwnerVerificationStatus.Verified });
        var propB = new Property { PropertyOwnerId = 2, Name = "Owner B Towers", Address = "2 Hill St", VerificationStatus = PropertyVerificationStatus.Approved };
        context.Properties.Add(propB);
        await context.SaveChangesAsync();

        var unitB1 = new Unit { PropertyId = propB.Id, UnitLabel = "B-1" };
        var unitB2 = new Unit { PropertyId = propB.Id, UnitLabel = "B-2" };
        context.Units.AddRange(unitB1, unitB2);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);

        // Fetch dashboard for Owner A (userId 101)
        var dashboardA = await service.GetOwnerDashboardAsync(101);

        Assert.NotNull(dashboardA);
        Assert.Equal(1, dashboardA!.TotalProperties);
        Assert.Equal(1, dashboardA.ActiveProperties);
        Assert.Equal(1, dashboardA.TotalUnits);
        Assert.Equal(1, dashboardA.ActiveUnits);

        // Fetch dashboard for Owner B (userId 202)
        var dashboardB = await service.GetOwnerDashboardAsync(202);

        Assert.NotNull(dashboardB);
        Assert.Equal(1, dashboardB!.TotalProperties);
        Assert.Equal(1, dashboardB.ActiveProperties);
        Assert.Equal(2, dashboardB.TotalUnits);
        Assert.Equal(2, dashboardB.ActiveUnits);
    }

    [Fact]
    public async Task GetOwnerDashboardAsync_UnverifiedOwner_ReturnsNull()
    {
        await using var context = CreateContext();

        // Owner with PendingVerification status
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.PendingVerification
        });

        var prop = new Property { PropertyOwnerId = 1, Name = "Unverified Prop", Address = "100 Street", VerificationStatus = PropertyVerificationStatus.Approved };
        context.Properties.Add(prop);
        await context.SaveChangesAsync();

        var service = new PropertyService(context);

        var dashboardPending = await service.GetOwnerDashboardAsync(101);
        Assert.Null(dashboardPending);

        // Owner with Rejected status
        var ownerRejected = await context.PropertyOwners.FirstAsync(po => po.Id == 1);
        ownerRejected.VerificationStatus = OwnerVerificationStatus.Rejected;
        await context.SaveChangesAsync();

        var dashboardRejected = await service.GetOwnerDashboardAsync(101);
        Assert.Null(dashboardRejected);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }
}
