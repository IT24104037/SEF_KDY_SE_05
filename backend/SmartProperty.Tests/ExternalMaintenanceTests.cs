using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Services;
using Xunit;

namespace SmartProperty.Tests;

public class ExternalMaintenanceTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);

        if (!context.Roles.Any())
        {
            context.Roles.AddRange(
                new Role { Id = 1, Name = "Admin" },
                new Role { Id = 2, Name = "PropertyOwner" },
                new Role { Id = 3, Name = "Tenant" },
                new Role { Id = 4, Name = "MaintenanceWorker" }
            );
            context.SaveChanges();
        }

        return context;
    }

    [Fact]
    public async Task CreateArrangementAsync_NormalRequest_TransitionsToOwnerArrangingExternalMaintenance()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("ExtTest_Normal_Transition");
        var service = new ExternalMaintenanceService(context);

        var ownerUser = new User { Id = 101, FullName = "Owner Alice", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Palm Grove", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "P-1" };
        var tenantUser = new User { Id = 201, FullName = "Tenant Bob", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 91,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Fix garden gate latch",
            RequestType = "NORMAL",
            Priority = "Low",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        var dto = new CreateExternalArrangementDto
        {
            ProviderName = "Colombo Welding & Gates Ltd",
            ContactPhone = "+94771234567",
            ContactEmail = "service@colombowelding.lk",
            EstimatedArrival = "Tomorrow 10:00 AM",
            EstimatedCost = 4500.00m,
            Note = "Requires custom latch replacement."
        };

        // Act
        var result = await service.CreateArrangementAsync(request.Id, dto, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Colombo Welding & Gates Ltd", result.ProviderName);
        Assert.Equal("Scheduled", result.Status);
        Assert.False(result.IsEmergency);

        // Verify request transitioned to OwnerArrangingExternalMaintenance
        var updatedReq = await context.MaintenanceRequests.FindAsync(request.Id);
        Assert.Equal("OwnerArrangingExternalMaintenance", updatedReq!.Status);

        // Verify status history recorded
        var history = await context.MaintenanceStatusHistories
            .FirstOrDefaultAsync(h => h.MaintenanceRequestId == request.Id && h.NewStatus == "OwnerArrangingExternalMaintenance");
        Assert.NotNull(history);
    }

    [Fact]
    public async Task CreateArrangementAsync_EmergencyRequest_TransitionsToOwnerArrangingExternalEmergencyService()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("ExtTest_Emergency_Transition");
        var service = new ExternalMaintenanceService(context);

        var ownerUser = new User { Id = 102, FullName = "Owner Bob", RoleId = 2 };
        var owner = new PropertyOwner { Id = 12, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 32, Name = "Highland Tower", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 42, PropertyId = property.Id, UnitLabel = "H-2" };
        var tenantUser = new User { Id = 202, FullName = "Tenant Charlie", RoleId = 3 };
        var tenant = new Tenant { Id = 52, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 62, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var emergencyRequest = new MaintenanceRequest
        {
            Id = 92,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Burst water pipe flooding hallway",
            RequestType = "EMERGENCY",
            Priority = "Emergency",
            Status = "Emergency"
        };
        context.MaintenanceRequests.Add(emergencyRequest);
        await context.SaveChangesAsync();

        var dto = new CreateExternalArrangementDto
        {
            ProviderName = "24/7 Rapid Plumbing Response",
            ContactPhone = "+94112999888",
            EstimatedArrival = "Within 45 minutes",
            EstimatedCost = 12000.00m,
            Note = "Emergency shutoff and pipe weld."
        };

        // Act
        var result = await service.CreateArrangementAsync(emergencyRequest.Id, dto, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsEmergency);

        // Verify request transitioned to OwnerArrangingExternalEmergencyService
        var updatedReq = await context.MaintenanceRequests.FindAsync(emergencyRequest.Id);
        Assert.Equal("OwnerArrangingExternalEmergencyService", updatedReq!.Status);
    }

    [Fact]
    public async Task ConfirmArrangementAsync_UpdatesStatusToScheduledAndLogsHistory()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("ExtTest_Confirm_Transition");
        var service = new ExternalMaintenanceService(context);

        var ownerUser = new User { Id = 103, FullName = "Owner Dave", RoleId = 2 };
        var owner = new PropertyOwner { Id = 13, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 33, Name = "Lakeview", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 43, PropertyId = property.Id, UnitLabel = "L-3" };
        var tenantUser = new User { Id = 203, FullName = "Tenant Eve", RoleId = 3 };
        var tenant = new Tenant { Id = 53, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 63, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 93,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Air conditioner leak",
            RequestType = "NORMAL",
            Status = "OwnerArrangingExternalMaintenance"
        };
        context.MaintenanceRequests.Add(request);

        var arrangement = new ExternalMaintenanceArrangement
        {
            Id = 701,
            MaintenanceRequestId = request.Id,
            ProviderName = "CoolBreeze HVAC",
            ContactPhone = "+94775556677",
            Status = "Scheduled",
            IsEmergency = false
        };
        context.ExternalMaintenanceArrangements.Add(arrangement);
        await context.SaveChangesAsync();

        var confirmDto = new ConfirmExternalArrangementDto
        {
            EstimatedArrival = "2026-09-20 14:00",
            Note = "Confirmed with dispatch officer."
        };

        // Act
        var result = await service.ConfirmArrangementAsync(arrangement.Id, confirmDto, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.Equal("Confirmed", result.Status);
        Assert.Equal("2026-09-20 14:00", result.EstimatedArrival);

        var updatedReq = await context.MaintenanceRequests.FindAsync(request.Id);
        Assert.Equal("ExternalMaintenanceScheduled", updatedReq!.Status);

        var history = await context.MaintenanceStatusHistories
            .FirstOrDefaultAsync(h => h.MaintenanceRequestId == request.Id && h.NewStatus == "ExternalMaintenanceScheduled");
        Assert.NotNull(history);
    }

    [Fact]
    public async Task CreateArrangementAsync_RejectsUnauthorizedOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("ExtTest_Unauthorized_Owner");
        var service = new ExternalMaintenanceService(context);

        var ownerUser1 = new User { Id = 104, FullName = "True Owner", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 14, UserId = ownerUser1.Id, User = ownerUser1 };
        var property = new Property { Id = 34, Name = "Villa 1", PropertyOwnerId = owner1.Id };
        var unit = new Unit { Id = 44, PropertyId = property.Id, UnitLabel = "V-1" };
        var tenantUser = new User { Id = 204, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 54, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 64, TenantId = tenant.Id, UnitId = unit.Id };

        // Another owner
        var ownerUser2 = new User { Id = 105, FullName = "Intruder Owner", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 15, UserId = ownerUser2.Id, User = ownerUser2 };

        context.Users.AddRange(ownerUser1, ownerUser2, tenantUser);
        context.PropertyOwners.AddRange(owner1, owner2);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 94,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Door handle broken",
            RequestType = "NORMAL",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        var dto = new CreateExternalArrangementDto { ProviderName = "Locksmith Express" };

        // Act & Assert: ownerUser2 cannot arrange for ownerUser1's property
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CreateArrangementAsync(request.Id, dto, ownerUser2.Id, "PropertyOwner"));
    }

    [Fact]
    public async Task CreateArrangementAsync_DoesNotCreateFakeWorker()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("ExtTest_No_Fake_Worker");
        var service = new ExternalMaintenanceService(context);

        var ownerUser = new User { Id = 106, FullName = "Owner Frank", RoleId = 2 };
        var owner = new PropertyOwner { Id = 16, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 35, Name = "Ocean Breeze", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 45, PropertyId = property.Id, UnitLabel = "OB-5" };
        var tenantUser = new User { Id = 205, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 55, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 65, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 95,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Roof tiles cracked",
            RequestType = "NORMAL",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        var initialWorkerCount = await context.Workers.CountAsync();

        var dto = new CreateExternalArrangementDto
        {
            ProviderName = "Lanka Roof Specialists",
            ContactPhone = "+94711122334"
        };

        // Act
        var result = await service.CreateArrangementAsync(request.Id, dto, ownerUser.Id, "PropertyOwner");

        // Assert: External arrangement saved
        Assert.NotNull(result);
        Assert.Equal("Lanka Roof Specialists", result.ProviderName);

        // Core business rule check: Workers count MUST NOT increase
        var finalWorkerCount = await context.Workers.CountAsync();
        Assert.Equal(initialWorkerCount, finalWorkerCount);
    }
}
