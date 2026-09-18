using System;
using System.Collections.Generic;
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

public class WorkOrderServiceTests
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
    public async Task GetWorkOrdersAsync_WorkerRole_ReturnsOnlyAssignedJobs()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Worker_Scoping");
        var service = new WorkOrderService(context);

        // Seed 2 workers
        var user1 = new User { Id = 201, FullName = "Worker One", RoleId = 4 };
        var worker1 = new Worker { Id = 1, UserId = user1.Id, User = user1, VerificationStatus = WorkerVerificationStatus.Verified };

        var user2 = new User { Id = 202, FullName = "Worker Two", RoleId = 4 };
        var worker2 = new Worker { Id = 2, UserId = user2.Id, User = user2, VerificationStatus = WorkerVerificationStatus.Verified };

        context.Users.AddRange(user1, user2);
        context.Workers.AddRange(worker1, worker2);

        // Seed property & requests
        var ownerUser = new User { Id = 101, FullName = "Owner", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Sunrise", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "A1" };
        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var req1 = new MaintenanceRequest { Id = 91, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Description = "Job 1" };
        var req2 = new MaintenanceRequest { Id = 92, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Description = "Job 2" };
        context.MaintenanceRequests.AddRange(req1, req2);

        // WorkOrder 1 for worker 1, WorkOrder 2 for worker 2
        var wo1 = new WorkOrder { Id = 501, MaintenanceRequestId = req1.Id, WorkerId = worker1.Id, Status = WorkOrderStatus.Assigned };
        var wo2 = new WorkOrder { Id = 502, MaintenanceRequestId = req2.Id, WorkerId = worker2.Id, Status = WorkOrderStatus.InProgress };
        context.WorkOrders.AddRange(wo1, wo2);

        await context.SaveChangesAsync();

        // Act: Worker 1 calls GetWorkOrdersAsync
        var result = await service.GetWorkOrdersAsync(user1.Id, "MaintenanceWorker");

        // Assert: Only sees wo1
        Assert.Single(result.WorkOrders);
        Assert.Equal(wo1.Id, result.WorkOrders[0].Id);
        Assert.Equal(worker1.Id, result.WorkOrders[0].WorkerId);
    }

    [Fact]
    public async Task GetWorkOrdersAsync_OwnerRole_ReturnsOnlyJobsForOwnedProperties()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Owner_Scoping");
        var service = new WorkOrderService(context);

        // Owner 1 and Property 1
        var ownerUser1 = new User { Id = 101, FullName = "Owner One", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 11, UserId = ownerUser1.Id, User = ownerUser1 };
        var prop1 = new Property { Id = 31, Name = "Prop 1", PropertyOwnerId = owner1.Id };
        var unit1 = new Unit { Id = 41, PropertyId = prop1.Id, UnitLabel = "1A" };

        // Owner 2 and Property 2
        var ownerUser2 = new User { Id = 102, FullName = "Owner Two", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 12, UserId = ownerUser2.Id, User = ownerUser2 };
        var prop2 = new Property { Id = 32, Name = "Prop 2", PropertyOwnerId = owner2.Id };
        var unit2 = new Unit { Id = 42, PropertyId = prop2.Id, UnitLabel = "2A" };

        var workerUser = new User { Id = 201, FullName = "Worker", RoleId = 4 };
        var worker = new Worker { Id = 1, UserId = workerUser.Id, User = workerUser, VerificationStatus = WorkerVerificationStatus.Verified };

        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant1 = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = prop1.Id, UnitId = unit1.Id };
        var tenancy1 = new Tenancy { Id = 61, TenantId = tenant1.Id, UnitId = unit1.Id };
        var tenant2 = new Tenant { Id = 52, UserId = tenantUser.Id, PropertyId = prop2.Id, UnitId = unit2.Id };
        var tenancy2 = new Tenancy { Id = 62, TenantId = tenant2.Id, UnitId = unit2.Id };

        context.Users.AddRange(ownerUser1, ownerUser2, workerUser, tenantUser);
        context.PropertyOwners.AddRange(owner1, owner2);
        context.Properties.AddRange(prop1, prop2);
        context.Units.AddRange(unit1, unit2);
        context.Tenants.AddRange(tenant1, tenant2);
        context.Tenancies.AddRange(tenancy1, tenancy2);
        context.Workers.Add(worker);

        var req1 = new MaintenanceRequest { Id = 91, TenantId = tenant1.Id, TenancyId = tenancy1.Id, PropertyId = prop1.Id, UnitId = unit1.Id, Description = "Req 1" };
        var req2 = new MaintenanceRequest { Id = 92, TenantId = tenant2.Id, TenancyId = tenancy2.Id, PropertyId = prop2.Id, UnitId = unit2.Id, Description = "Req 2" };
        context.MaintenanceRequests.AddRange(req1, req2);

        var wo1 = new WorkOrder { Id = 501, MaintenanceRequestId = req1.Id, WorkerId = worker.Id, Status = WorkOrderStatus.Assigned };
        var wo2 = new WorkOrder { Id = 502, MaintenanceRequestId = req2.Id, WorkerId = worker.Id, Status = WorkOrderStatus.Assigned };
        context.WorkOrders.AddRange(wo1, wo2);

        await context.SaveChangesAsync();

        // Act: Owner 1 calls GetWorkOrdersAsync
        var result = await service.GetWorkOrdersAsync(ownerUser1.Id, "PropertyOwner");

        // Assert: Only sees wo1
        Assert.Single(result.WorkOrders);
        Assert.Equal(wo1.Id, result.WorkOrders[0].Id);
    }

    [Fact]
    public async Task UpdateWorkOrderStatusAsync_AssignedToInProgress_SetsStartedAtAndUpdatesMaintenanceRequest()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Start_Job");
        var service = new WorkOrderService(context);

        var workerUser = new User { Id = 201, FullName = "Worker Bob", RoleId = 4 };
        var worker = new Worker { Id = 1, UserId = workerUser.Id, User = workerUser, VerificationStatus = WorkerVerificationStatus.Verified };
        var ownerUser = new User { Id = 101, FullName = "Owner", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Villa", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "A1" };
        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(workerUser, ownerUser, tenantUser);
        context.Workers.Add(worker);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest { Id = 91, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Status = "Assigned", Description = "Fix tap" };
        context.MaintenanceRequests.Add(request);

        var workOrder = new WorkOrder { Id = 501, MaintenanceRequestId = request.Id, WorkerId = worker.Id, Status = WorkOrderStatus.Assigned };
        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        var updateDto = new UpdateWorkOrderStatusDto
        {
            Status = "InProgress",
            Notes = "Started inspecting the tap."
        };

        // Act: Worker starts job
        var result = await service.UpdateWorkOrderStatusAsync(workOrder.Id, updateDto, workerUser.Id, "MaintenanceWorker");

        // Assert
        Assert.Equal("InProgress", result.Status);
        Assert.NotNull(result.StartedAt);
        Assert.Equal("Started inspecting the tap.", result.Notes);

        var dbWorkOrder = await context.WorkOrders.FindAsync(workOrder.Id);
        Assert.Equal(WorkOrderStatus.InProgress, dbWorkOrder!.Status);
        Assert.NotNull(dbWorkOrder.StartedAt);

        var dbRequest = await context.MaintenanceRequests.FindAsync(request.Id);
        Assert.Equal("InProgress", dbRequest!.Status);
    }

    [Fact]
    public async Task UpdateWorkOrderStatusAsync_InProgressToCompleted_EnforcesEvidenceAndUpdatesCompletedAt()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Complete_Job");
        var service = new WorkOrderService(context);

        var workerUser = new User { Id = 201, FullName = "Worker Bob", RoleId = 4 };
        var worker = new Worker { Id = 1, UserId = workerUser.Id, User = workerUser, VerificationStatus = WorkerVerificationStatus.Verified };
        var ownerUser = new User { Id = 101, FullName = "Owner", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Villa", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "A1" };
        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(workerUser, ownerUser, tenantUser);
        context.Workers.Add(worker);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest { Id = 91, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Status = "InProgress", Description = "Fix tap" };
        context.MaintenanceRequests.Add(request);

        var workOrder = new WorkOrder
        {
            Id = 501,
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            Status = WorkOrderStatus.InProgress,
            StartedAt = DateTime.UtcNow.AddHours(-1)
        };
        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        // 1. Attempt completing without notes -> throws ArgumentException
        var invalidDto = new UpdateWorkOrderStatusDto { Status = "Completed", CompletionNotes = "" };
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateWorkOrderStatusAsync(workOrder.Id, invalidDto, workerUser.Id, "MaintenanceWorker"));

        // 2. Complete with required evidence notes & evidence URL
        var validDto = new UpdateWorkOrderStatusDto
        {
            Status = "Completed",
            CompletionNotes = "Replaced faulty washer. Tested pressure with zero leaks.",
            CompletionEvidenceUrl = "https://example.com/uploads/photo-after.jpg"
        };

        var result = await service.UpdateWorkOrderStatusAsync(workOrder.Id, validDto, workerUser.Id, "MaintenanceWorker");

        Assert.Equal("Completed", result.Status);
        Assert.NotNull(result.CompletedAt);
        Assert.Equal("Replaced faulty washer. Tested pressure with zero leaks.", result.CompletionNotes);
        Assert.Equal("https://example.com/uploads/photo-after.jpg", result.CompletionEvidenceUrl);

        var dbRequest = await context.MaintenanceRequests.FindAsync(request.Id);
        Assert.Equal("Completed", dbRequest!.Status);
    }

    [Fact]
    public async Task UpdateWorkOrderStatusAsync_AssignedToCompletedDirectly_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Direct_Complete_Rejected");
        var service = new WorkOrderService(context);

        var workerUser = new User { Id = 201, FullName = "Worker Bob", RoleId = 4 };
        var worker = new Worker { Id = 1, UserId = workerUser.Id, User = workerUser, VerificationStatus = WorkerVerificationStatus.Verified };
        var ownerUser = new User { Id = 101, FullName = "Owner", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Villa", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "A1" };
        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(workerUser, ownerUser, tenantUser);
        context.Workers.Add(worker);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest { Id = 91, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Status = "Assigned", Description = "Fix tap" };
        context.MaintenanceRequests.Add(request);

        var workOrder = new WorkOrder { Id = 501, MaintenanceRequestId = request.Id, WorkerId = worker.Id, Status = WorkOrderStatus.Assigned };
        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        var directCompleteDto = new UpdateWorkOrderStatusDto
        {
            Status = "Completed",
            CompletionNotes = "Tried skipping InProgress state"
        };

        // Act & Assert: Must throw InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateWorkOrderStatusAsync(workOrder.Id, directCompleteDto, workerUser.Id, "MaintenanceWorker"));
    }

    [Fact]
    public async Task UpdateWorkOrderStatusAsync_WorkerCannotCancel_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WOTest_Worker_Cannot_Cancel");
        var service = new WorkOrderService(context);

        var workerUser = new User { Id = 201, FullName = "Worker Bob", RoleId = 4 };
        var worker = new Worker { Id = 1, UserId = workerUser.Id, User = workerUser, VerificationStatus = WorkerVerificationStatus.Verified };
        var ownerUser = new User { Id = 101, FullName = "Owner", RoleId = 2 };
        var owner = new PropertyOwner { Id = 11, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 31, Name = "Villa", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 41, PropertyId = property.Id, UnitLabel = "A1" };
        var tenantUser = new User { Id = 301, FullName = "Tenant", RoleId = 3 };
        var tenant = new Tenant { Id = 51, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 61, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(workerUser, ownerUser, tenantUser);
        context.Workers.Add(worker);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest { Id = 91, TenantId = tenant.Id, TenancyId = tenancy.Id, PropertyId = property.Id, UnitId = unit.Id, Status = "Assigned", Description = "Fix tap" };
        context.MaintenanceRequests.Add(request);

        var workOrder = new WorkOrder { Id = 501, MaintenanceRequestId = request.Id, WorkerId = worker.Id, Status = WorkOrderStatus.Assigned };
        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        var cancelDto = new UpdateWorkOrderStatusDto
        {
            Status = "Cancelled",
            Notes = "Worker wants to cancel"
        };

        // Act & Assert: Worker cannot cancel, only Owner or Admin can
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateWorkOrderStatusAsync(workOrder.Id, cancelDto, workerUser.Id, "MaintenanceWorker"));
    }
}
