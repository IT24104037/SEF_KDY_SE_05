using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Services;
using Xunit;

namespace SmartProperty.Tests;

public class WorkerRecommendationTests
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
    public async Task GetRecommendationAsync_NormalRequest_MatchesVerifiedWorkerWithSkill()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("RecTest_Normal_Match");
        var passwordHasher = new PasswordHasher<User>();
        var workerService = new WorkerService(context, passwordHasher);
        var recService = new WorkerRecommendationService(context, workerService);

        // Seed PropertyOwner & Property
        var ownerUser = new User { Id = 101, FullName = "Owner John", Email = "owner@test.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 501, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 201, Name = "Sunrise Villa", Address = "10 Galle Rd", City = "Colombo", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 301, PropertyId = property.Id, UnitLabel = "U-1" };
        context.Users.Add(ownerUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);

        // Seed Category
        var category = new MaintenanceCategory { Id = 10, Name = "Plumbing" };
        context.MaintenanceCategories.Add(category);

        // Seed MaintenanceRequest
        var tenantUser = new User { Id = 102, FullName = "Tenant Sam", Email = "tenant@test.com", RoleId = 3 };
        var tenant = new Tenant { Id = 601, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 701, TenantId = tenant.Id, UnitId = unit.Id };
        context.Users.Add(tenantUser);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 901,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            CategoryId = category.Id,
            Description = "Leaking bathroom pipe",
            RequestType = "NORMAL",
            Priority = "Medium",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);

        // Seed verified worker with Plumbing skill
        var workerUser = new User { Id = 103, FullName = "Kamal Plumber", Email = "kamal@test.com", RoleId = 4, IsActive = true };
        var worker = new Worker
        {
            Id = 801,
            UserId = workerUser.Id,
            User = workerUser,
            VerificationStatus = WorkerVerificationStatus.Verified,
            IsAvailable = true,
            HourlyRate = 25.00m
        };
        worker.Skills.Add(new WorkerSkill { WorkerId = worker.Id, SkillName = "Plumbing", CategoryId = category.Id });
        worker.ServiceAreas.Add(new ServiceArea { WorkerId = worker.Id, City = "Colombo", RadiusKm = 30.0 });
        context.Users.Add(workerUser);
        context.Workers.Add(worker);

        await context.SaveChangesAsync();

        // Act
        var result = await recService.GetRecommendationAsync(request.Id, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.HasAvailableWorker);
        Assert.Equal(worker.Id, result.RecommendedWorkerId);
        Assert.Equal("Kamal Plumber", result.RecommendedWorker);
        Assert.Equal("Plumbing", result.WorkerSkill);
        Assert.Contains("Passed", result.ValidationStatus);
    }

    [Fact]
    public async Task GetRecommendationAsync_Emergency_ReturnsNoAvailableWorker_WhenNoneFreeNow()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("RecTest_Emergency_NoFreeWorker");
        var passwordHasher = new PasswordHasher<User>();
        var workerService = new WorkerService(context, passwordHasher);
        var recService = new WorkerRecommendationService(context, workerService);

        var ownerUser = new User { Id = 111, FullName = "Owner Bob", Email = "bob@test.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 502, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 202, Name = "Highland Tower", Address = "50 Kandy Rd", City = "Kandy", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 302, PropertyId = property.Id, UnitLabel = "A-1" };
        var tenantUser = new User { Id = 112, FullName = "Tenant Alice", Email = "alice@test.com", RoleId = 3 };
        var tenant = new Tenant { Id = 602, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 702, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var category = new MaintenanceCategory { Id = 11, Name = "Electrical" };
        context.MaintenanceCategories.Add(category);

        var emergencyRequest = new MaintenanceRequest
        {
            Id = 902,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            CategoryId = category.Id,
            Description = "Electrical fire spark in main breaker",
            RequestType = "EMERGENCY",
            Priority = "Emergency",
            Status = "Emergency"
        };
        context.MaintenanceRequests.Add(emergencyRequest);

        // Worker exists but has NO active availability slot right now (so FreeNow will be false)
        var workerUser = new User { Id = 113, FullName = "Nimal Electrician", Email = "nimal@test.com", RoleId = 4, IsActive = true };
        var worker = new Worker
        {
            Id = 802,
            UserId = workerUser.Id,
            User = workerUser,
            VerificationStatus = WorkerVerificationStatus.Verified,
            IsAvailable = true
        };
        worker.Skills.Add(new WorkerSkill { WorkerId = worker.Id, SkillName = "Electrical", CategoryId = category.Id });
        context.Users.Add(workerUser);
        context.Workers.Add(worker);

        await context.SaveChangesAsync();

        // Act
        var result = await recService.GetRecommendationAsync(emergencyRequest.Id, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.False(result.HasAvailableWorker);
        Assert.Equal("NO_AVAILABLE_EMERGENCY_WORKER", result.ValidationStatus);
        Assert.True(result.IsEmergency);
        Assert.Contains("Immediate external emergency maintenance", result.Message);
    }

    [Fact]
    public async Task GetRecommendationAsync_RejectsUnauthorizedOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("RecTest_Unauthorized_Owner");
        var passwordHasher = new PasswordHasher<User>();
        var workerService = new WorkerService(context, passwordHasher);
        var recService = new WorkerRecommendationService(context, workerService);

        var ownerUser1 = new User { Id = 121, FullName = "Owner True", Email = "owner1@test.com", RoleId = 2 };
        var owner1 = new PropertyOwner { Id = 503, UserId = ownerUser1.Id, User = ownerUser1 };
        var property = new Property { Id = 203, Name = "Villa 1", Address = "Galle", PropertyOwnerId = owner1.Id };
        var unit = new Unit { Id = 303, PropertyId = property.Id, UnitLabel = "V-1" };
        var tenantUser = new User { Id = 122, FullName = "Tenant T", Email = "t@test.com", RoleId = 3 };
        var tenant = new Tenant { Id = 603, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 703, TenantId = tenant.Id, UnitId = unit.Id };

        var ownerUser2 = new User { Id = 124, FullName = "Other Owner", Email = "owner2@test.com", RoleId = 2 };
        var owner2 = new PropertyOwner { Id = 504, UserId = ownerUser2.Id, User = ownerUser2 };

        context.Users.AddRange(ownerUser1, tenantUser, ownerUser2);
        context.PropertyOwners.AddRange(owner1, owner2);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 903,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Roof leak",
            RequestType = "NORMAL",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        // Act & Assert: Other owner (User 124) should be forbidden
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            recService.GetRecommendationAsync(request.Id, ownerUser2.Id, "PropertyOwner"));
    }

    [Fact]
    public async Task ProcessApprovalAsync_Approve_CreatesWorkOrderAndAuditableDecision()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("RecTest_Approve_CreatesWorkOrder");
        var passwordHasher = new PasswordHasher<User>();
        var workerService = new WorkerService(context, passwordHasher);
        var recService = new WorkerRecommendationService(context, workerService);

        var ownerUser = new User { Id = 131, FullName = "Owner Dave", Email = "dave@test.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 505, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 204, Name = "Ocean Breeze", Address = "Matara", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 304, PropertyId = property.Id, UnitLabel = "OB-1" };
        var tenantUser = new User { Id = 132, FullName = "Tenant Dan", Email = "dan@test.com", RoleId = 3 };
        var tenant = new Tenant { Id = 604, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 704, TenantId = tenant.Id, UnitId = unit.Id };

        var workerUser = new User { Id = 133, FullName = "Sunil Carpentry", Email = "sunil@test.com", RoleId = 4, IsActive = true };
        var worker = new Worker
        {
            Id = 803,
            UserId = workerUser.Id,
            User = workerUser,
            VerificationStatus = WorkerVerificationStatus.Verified,
            IsAvailable = true
        };

        context.Users.AddRange(ownerUser, tenantUser, workerUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);
        context.Workers.Add(worker);

        var request = new MaintenanceRequest
        {
            Id = 904,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Door hinge broken",
            RequestType = "NORMAL",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        var approvalDto = new ApprovalRequestDto
        {
            Decision = "Approve",
            WorkerId = worker.Id,
            ScheduledDate = DateTime.UtcNow.AddDays(2),
            Notes = "Approved by owner. Please arrive on time."
        };

        // Act
        var response = await recService.ProcessApprovalAsync(request.Id, approvalDto, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.True(response.Success);
        Assert.Equal("Approved", response.Decision);
        Assert.True(response.CreatedWorkOrder);
        Assert.NotNull(response.WorkOrderId);

        // Verify WorkOrder persisted
        var savedWorkOrder = await context.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == response.WorkOrderId);
        Assert.NotNull(savedWorkOrder);
        Assert.Equal(request.Id, savedWorkOrder.MaintenanceRequestId);
        Assert.Equal(worker.Id, savedWorkOrder.WorkerId);
        Assert.Equal(WorkOrderStatus.Assigned, savedWorkOrder.Status);

        // Verify ApprovalDecision persisted
        var savedDecision = await context.ApprovalDecisions.FirstOrDefaultAsync(ad => ad.MaintenanceRequestId == request.Id);
        Assert.NotNull(savedDecision);
        Assert.Equal("Approved", savedDecision.Decision);
        Assert.Equal(owner.Id, savedDecision.PropertyOwnerId);

        // Verify MaintenanceRequest status updated to "Assigned"
        var updatedRequest = await context.MaintenanceRequests.FindAsync(request.Id);
        Assert.Equal("Assigned", updatedRequest!.Status);
    }

    [Fact]
    public async Task ProcessApprovalAsync_Reject_PreservesAuditableDecision_WithoutWorkOrder()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("RecTest_Reject_PreservesDecision");
        var passwordHasher = new PasswordHasher<User>();
        var workerService = new WorkerService(context, passwordHasher);
        var recService = new WorkerRecommendationService(context, workerService);

        var ownerUser = new User { Id = 141, FullName = "Owner Frank", Email = "frank@test.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 506, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 205, Name = "Pine Hills", Address = "Nuwara Eliya", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 305, PropertyId = property.Id, UnitLabel = "PH-1" };
        var tenantUser = new User { Id = 142, FullName = "Tenant Tim", Email = "tim@test.com", RoleId = 3 };
        var tenant = new Tenant { Id = 605, UserId = tenantUser.Id, PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 705, TenantId = tenant.Id, UnitId = unit.Id };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);

        var request = new MaintenanceRequest
        {
            Id = 905,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            Description = "Window replacement",
            RequestType = "NORMAL",
            Status = "Submitted"
        };
        context.MaintenanceRequests.Add(request);
        await context.SaveChangesAsync();

        var rejectDto = new ApprovalRequestDto
        {
            Decision = "Reject",
            Notes = "Too costly, will handle via warranty."
        };

        // Act
        var response = await recService.ProcessApprovalAsync(request.Id, rejectDto, ownerUser.Id, "PropertyOwner");

        // Assert
        Assert.True(response.Success);
        Assert.Equal("Rejected", response.Decision);
        Assert.False(response.CreatedWorkOrder);
        Assert.Null(response.WorkOrderId);

        // No WorkOrder created
        Assert.False(await context.WorkOrders.AnyAsync(wo => wo.MaintenanceRequestId == request.Id));

        // Auditable decision exists
        var savedDecision = await context.ApprovalDecisions.FirstOrDefaultAsync(ad => ad.MaintenanceRequestId == request.Id);
        Assert.NotNull(savedDecision);
        Assert.Equal("Rejected", savedDecision.Decision);
        Assert.Equal("Too costly, will handle via warranty.", savedDecision.Notes);
    }
}
