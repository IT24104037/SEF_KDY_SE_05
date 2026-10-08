using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Tools;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using Xunit;

namespace SmartProperty.Tests.AgenticAI;

/// <summary>
/// Unit tests for TechnicianMatchingAgent (Agent 3).
///
/// SE3110 — Member 4: Agentic AI Testing
/// Test ID : AI-04 (Technician Matching Testing)
/// Author  : Member 4
/// Date    : 2026-10-08
/// </summary>
public class Agent3Tests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    // =========================================================================
    // AI-04-T1: Required skill missing across all active verified workers
    // =========================================================================

    /// <summary>
    /// Verifies that when no verified worker possesses the requested skill (e.g. "Plumbing"),
    /// TechnicianMatchingAgent returns NO_WORKER_WITH_REQUIRED_SKILL with WorkerId = null
    /// and persists the match recommendation result.
    /// </summary>
    [Fact]
    public async Task Agent3_ExecuteAsync_NoWorkerWithRequiredSkill_ReturnsNoWorkerWithRequiredSkill()
    {
        // Arrange
        using var context = CreateInMemoryDbContext(Guid.NewGuid().ToString());

        var user = new User { Id = 1, FullName = "Electrician Joe", Email = "joe@test.com", IsActive = true };
        var worker = new Worker { Id = 10, UserId = user.Id, User = user, VerificationStatus = WorkerVerificationStatus.Verified, IsAvailable = true };
        var skill = new WorkerSkill { Id = 100, WorkerId = worker.Id, SkillName = "Electrical", YearsOfExperience = 4 };
        worker.Skills.Add(skill);
        context.Users.Add(user);
        context.Workers.Add(worker);
        await context.SaveChangesAsync();

        var workerTool = new WorkerMatchingTool(context);
        var agent = new TechnicianMatchingAgent(workerTool, context);

        var input = new Agent3Input
        {
            MaintenanceRequestId = 501,
            RequiredSkill = "Plumbing",
            PropertyCity = "Colombo",
            IsEmergency = false
        };

        // Act
        Agent3Result result = await agent.ExecuteAsync(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("NO_WORKER_WITH_REQUIRED_SKILL", result.Result);
        Assert.Null(result.WorkerId);
        Assert.Equal("No verified and active worker has the required skill 'Plumbing'.", result.Reason);

        // Assert Database Persistence
        var recommendation = await context.WorkerMatchRecommendations.FirstOrDefaultAsync(r => r.MaintenanceRequestId == 501);
        Assert.NotNull(recommendation);
        Assert.Equal("NO_WORKER_WITH_REQUIRED_SKILL", recommendation.Result);
    }

    // =========================================================================
    // AI-04-T2: Skilled worker exists but outside property service area
    // =========================================================================

    /// <summary>
    /// Verifies that when a worker possesses the required skill ("Electrical") but serves "Kandy",
    /// and the property is located in "Colombo", TechnicianMatchingAgent returns NO_WORKER_IN_LOCATION.
    /// </summary>
    [Fact]
    public async Task Agent3_ExecuteAsync_WorkerWithSkillOutsideLocation_ReturnsNoWorkerInLocation()
    {
        // Arrange
        using var context = CreateInMemoryDbContext(Guid.NewGuid().ToString());

        var user = new User { Id = 2, FullName = "Kandy Tech", Email = "kandytech@test.com", IsActive = true };
        var worker = new Worker { Id = 20, UserId = user.Id, User = user, VerificationStatus = WorkerVerificationStatus.Verified, IsAvailable = true };
        worker.Skills.Add(new WorkerSkill { Id = 101, WorkerId = worker.Id, SkillName = "Electrical", YearsOfExperience = 6 });
        worker.ServiceAreas.Add(new ServiceArea { Id = 201, WorkerId = worker.Id, City = "Kandy", RadiusKm = 15 });

        context.Users.Add(user);
        context.Workers.Add(worker);
        await context.SaveChangesAsync();

        var workerTool = new WorkerMatchingTool(context);
        var agent = new TechnicianMatchingAgent(workerTool, context);

        var input = new Agent3Input
        {
            MaintenanceRequestId = 502,
            RequiredSkill = "Electrical",
            PropertyCity = "Colombo",
            IsEmergency = false
        };

        // Act
        Agent3Result result = await agent.ExecuteAsync(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("NO_WORKER_IN_LOCATION", result.Result);
        Assert.Null(result.WorkerId);
        Assert.Equal("Workers with skill 'Electrical' exist, but none serve this property location.", result.Reason);
    }

    // =========================================================================
    // AI-04-T3: Emergency match found for available skilled local worker
    // =========================================================================

    /// <summary>
    /// Verifies that an emergency request finds a MATCH_FOUND when an available, verified,
    /// skilled worker serves the property location and has zero active conflicting jobs.
    /// </summary>
    [Fact]
    public async Task Agent3_ExecuteAsync_EmergencyMatchFound_ReturnsMatchFoundWithWorkerDetails()
    {
        // Arrange
        using var context = CreateInMemoryDbContext(Guid.NewGuid().ToString());

        var user = new User { Id = 3, FullName = "Emergency Plumber", Email = "plumber@test.com", IsActive = true };
        var worker = new Worker { Id = 30, UserId = user.Id, User = user, VerificationStatus = WorkerVerificationStatus.Verified, IsAvailable = true };
        worker.Skills.Add(new WorkerSkill { Id = 102, WorkerId = worker.Id, SkillName = "Plumbing", YearsOfExperience = 8 });
        worker.ServiceAreas.Add(new ServiceArea { Id = 202, WorkerId = worker.Id, City = "Colombo", RadiusKm = 20 });

        // Add active availability for all days of the week
        foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
        {
            worker.Availabilities.Add(new WorkerAvailability
            {
                Id = 300 + (int)day,
                WorkerId = worker.Id,
                DayOfWeek = day,
                StartTime = TimeSpan.FromHours(0),
                EndTime = TimeSpan.FromHours(23).Add(TimeSpan.FromMinutes(59)),
                IsActive = true
            });
        }

        context.Users.Add(user);
        context.Workers.Add(worker);
        await context.SaveChangesAsync();

        var workerTool = new WorkerMatchingTool(context);
        var agent = new TechnicianMatchingAgent(workerTool, context);

        var input = new Agent3Input
        {
            MaintenanceRequestId = 503,
            RequiredSkill = "Plumbing",
            PropertyCity = "Colombo",
            IsEmergency = true
        };

        // Act
        Agent3Result result = await agent.ExecuteAsync(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("MATCH_FOUND", result.Result);
        Assert.Equal(30, result.WorkerId);
        Assert.Equal("Emergency Plumber", result.WorkerName);
        Assert.True(result.IsEmergency);
        Assert.NotNull(result.SuggestedDateTime);
    }

    // =========================================================================
    // AI-04-T4: Normal maintenance match found with next available time slot
    // =========================================================================

    /// <summary>
    /// Verifies that a normal maintenance request matches an eligible worker and assigns
    /// the next available time slot.
    /// </summary>
    [Fact]
    public async Task Agent3_ExecuteAsync_NormalMaintenanceMatchFound_ReturnsMatchFoundWithSuggestedTime()
    {
        // Arrange
        using var context = CreateInMemoryDbContext(Guid.NewGuid().ToString());

        var user = new User { Id = 4, FullName = "General Electrician", Email = "electrician@test.com", IsActive = true };
        var worker = new Worker { Id = 40, UserId = user.Id, User = user, VerificationStatus = WorkerVerificationStatus.Verified, IsAvailable = true };
        worker.Skills.Add(new WorkerSkill { Id = 103, WorkerId = worker.Id, SkillName = "Electrical", YearsOfExperience = 5 });
        worker.ServiceAreas.Add(new ServiceArea { Id = 203, WorkerId = worker.Id, City = "Galle", RadiusKm = 10 });

        foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
        {
            worker.Availabilities.Add(new WorkerAvailability
            {
                Id = 400 + (int)day,
                WorkerId = worker.Id,
                DayOfWeek = day,
                StartTime = TimeSpan.FromHours(8),
                EndTime = TimeSpan.FromHours(17),
                IsActive = true
            });
        }

        context.Users.Add(user);
        context.Workers.Add(worker);
        await context.SaveChangesAsync();

        var workerTool = new WorkerMatchingTool(context);
        var agent = new TechnicianMatchingAgent(workerTool, context);

        var preferred = DateTime.UtcNow;
        var input = new Agent3Input
        {
            MaintenanceRequestId = 504,
            RequiredSkill = "Electrical",
            PropertyCity = "Galle",
            IsEmergency = false,
            PreferredDateTime = preferred
        };

        // Act
        Agent3Result result = await agent.ExecuteAsync(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("MATCH_FOUND", result.Result);
        Assert.Equal(40, result.WorkerId);
        Assert.Equal("General Electrician", result.WorkerName);
        Assert.False(result.IsEmergency);
        Assert.NotNull(result.SuggestedDateTime);
    }

    // =========================================================================
    // AI-04-T5: Emergency worker busy with active job -> NO_AVAILABLE_EMERGENCY_WORKER
    // =========================================================================

    /// <summary>
    /// Verifies that if an emergency worker has an active assigned work order,
    /// TechnicianMatchingAgent reports NO_AVAILABLE_EMERGENCY_WORKER.
    /// </summary>
    [Fact]
    public async Task Agent3_ExecuteAsync_EmergencyWorkerBusy_ReturnsNoAvailableEmergencyWorker()
    {
        // Arrange
        using var context = CreateInMemoryDbContext(Guid.NewGuid().ToString());

        var user = new User { Id = 5, FullName = "Busy Plumber", Email = "busy@test.com", IsActive = true };
        var worker = new Worker { Id = 50, UserId = user.Id, User = user, VerificationStatus = WorkerVerificationStatus.Verified, IsAvailable = true };
        worker.Skills.Add(new WorkerSkill { Id = 104, WorkerId = worker.Id, SkillName = "Plumbing", YearsOfExperience = 7 });
        worker.ServiceAreas.Add(new ServiceArea { Id = 204, WorkerId = worker.Id, City = "Colombo", RadiusKm = 10 });

        foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
        {
            worker.Availabilities.Add(new WorkerAvailability
            {
                Id = 500 + (int)day,
                WorkerId = worker.Id,
                DayOfWeek = day,
                StartTime = TimeSpan.FromHours(0),
                EndTime = TimeSpan.FromHours(23).Add(TimeSpan.FromMinutes(59)),
                IsActive = true
            });
        }

        // Active work order assigned to worker
        worker.WorkOrders.Add(new WorkOrder
        {
            Id = 901,
            WorkerId = worker.Id,
            Status = WorkOrderStatus.Assigned,
            MaintenanceRequestId = 401
        });

        context.Users.Add(user);
        context.Workers.Add(worker);
        await context.SaveChangesAsync();

        var workerTool = new WorkerMatchingTool(context);
        var agent = new TechnicianMatchingAgent(workerTool, context);

        var input = new Agent3Input
        {
            MaintenanceRequestId = 505,
            RequiredSkill = "Plumbing",
            PropertyCity = "Colombo",
            IsEmergency = true
        };

        // Act
        Agent3Result result = await agent.ExecuteAsync(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("NO_AVAILABLE_EMERGENCY_WORKER", result.Result);
        Assert.Null(result.WorkerId);
    }
}
