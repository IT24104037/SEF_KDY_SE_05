using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class UnitSearchFilterSortPaginationTests
{
    [Fact]
    public async Task GetUnitsAsync_SearchFilterSortAndPaginate_ReturnsExpectedPagedResult()
    {
        await using var context = CreateContext();
        var property = await AddVerifiedOwnerAndPropertyAsync(context, ownerId: 1, userId: 101);

        var unit1 = new Unit { PropertyId = property.Id, UnitLabel = "A-101", Description = "Luxury Studio", CreatedAt = DateTime.UtcNow.AddDays(-10) };
        var unit2 = new Unit { PropertyId = property.Id, UnitLabel = "A-102", Description = "Penthouse Suite", CreatedAt = DateTime.UtcNow.AddDays(-5) };
        var unit3 = new Unit { PropertyId = property.Id, UnitLabel = "B-201", Description = "Standard Room", CreatedAt = DateTime.UtcNow.AddDays(-1) };
        var unit4 = new Unit { PropertyId = property.Id, UnitLabel = "B-202", Description = "Standard Studio", CreatedAt = DateTime.UtcNow, IsArchived = true }; // Archived unit

        context.Units.AddRange(unit1, unit2, unit3, unit4);
        await context.SaveChangesAsync();

        // Add tenant and active tenancy to unit1 (making it Occupied)
        var tenant = new Tenant
        {
            PropertyId = property.Id,
            UnitId = unit1.Id,
            FullName = "John Tenant",
            MobileNumber = "+111222333"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        context.Tenancies.Add(new Tenancy
        {
            TenantId = tenant.Id,
            UnitId = unit1.Id,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            Status = TenancyStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new PropertyService(context);

        // Test 1: Search by 'Studio'
        var searchResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Search = "Studio" });
        Assert.Equal(1, searchResult.TotalCount);
        Assert.Single(searchResult.Items);
        Assert.Equal("A-101", searchResult.Items[0].UnitLabel);

        // Test 2: Search by 'B-' (UnitLabel)
        var searchLabelResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Search = "B-" });
        Assert.Equal(1, searchLabelResult.TotalCount);
        Assert.Equal("B-201", searchLabelResult.Items[0].UnitLabel);

        // Test 3: Filter by Status 'Occupied'
        var occupiedResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Status = "Occupied" });
        Assert.Equal(1, occupiedResult.TotalCount);
        Assert.Equal("Occupied", occupiedResult.Items[0].OccupancyStatus);
        Assert.Equal("A-101", occupiedResult.Items[0].UnitLabel);

        // Test 4: Filter by Status 'Vacant'
        var vacantResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Status = "Vacant" });
        Assert.Equal(2, vacantResult.TotalCount); // A-102 and B-201
        Assert.All(vacantResult.Items, u => Assert.Equal("Vacant", u.OccupancyStatus));

        // Test 5: Sorting by CreatedAt Ascending vs Descending
        var sortAscResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { SortBy = "createdAt", SortDirection = "asc" });
        Assert.Equal("A-101", sortAscResult.Items.First().UnitLabel);

        var sortDescResult = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { SortBy = "createdAt", SortDirection = "desc" });
        Assert.Equal("B-201", sortDescResult.Items.First().UnitLabel);

        // Test 6: Pagination and TotalCount calculation before Skip/Take
        var pagedResultPage1 = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Page = 1, PageSize = 2, SortBy = "label", SortDirection = "asc" });
        Assert.Equal(3, pagedResultPage1.TotalCount); // 3 non-archived active units
        Assert.Equal(2, pagedResultPage1.Items.Count);
        Assert.Equal("A-101", pagedResultPage1.Items[0].UnitLabel);
        Assert.Equal("A-102", pagedResultPage1.Items[1].UnitLabel);

        var pagedResultPage2 = await service.GetUnitsAsync(101, property.Id, new UnitQueryParameters { Page = 2, PageSize = 2, SortBy = "label", SortDirection = "asc" });
        Assert.Equal(3, pagedResultPage2.TotalCount);
        Assert.Single(pagedResultPage2.Items);
        Assert.Equal("B-201", pagedResultPage2.Items[0].UnitLabel);
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
            Address = "100 Main St",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        return property;
    }
}
