using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Entities.Worker;
using Xunit;

namespace SmartProperty.Tests.AgenticAI;

public class Agent4Tests
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

    private static (MaintenanceRequest Request, Worker Worker) SeedBaseData(
        AppDbContext context,
        string categoryName = "Plumbing",
        string workerSkill = "Plumbing",
        string city = "Colombo",
        WorkerVerificationStatus verificationStatus = WorkerVerificationStatus.Verified,
        decimal hourlyRate = 3500m)
    {
        var ownerUser = new User { Id = 100, FullName = "Owner Alice", Email = "alice@prop.com", RoleId = 2 };
        var owner = new PropertyOwner { Id = 100, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property
        {
            Id = 100,
            Name = "Lotus Grove",
            Address = "12 Galle Rd",
            City = city,
            Latitude = 6.9271m,
            Longitude = 79.8612m,
            PropertyOwnerId = owner.Id
        };
        var unit = new Unit { Id = 100, PropertyId = property.Id, UnitLabel = "A-1" };

        var tenantUser = new User { Id = 200, FullName = "Tenant Bob", Email = "bob@tenant.com", RoleId = 3 };
        var tenant = new Tenant
        {
            Id = 200,
            UserId = tenantUser.Id,
            User = tenantUser,
            PropertyId = property.Id,
            UnitId = unit.Id,
            FullName = "Tenant Bob",
            MobileNumber = "0771234567"
        };
        var tenancy = new Tenancy { Id = 200, TenantId = tenant.Id, UnitId = unit.Id };

        var category = new MaintenanceCategory { Id = 100, Name = categoryName, Description = "Category" };

        var request = new MaintenanceRequest
        {
            Id = 100,
            PropertyId = property.Id,
            Property = property,
            UnitId = unit.Id,
            Unit = unit,
            TenantId = tenant.Id,
            Tenant = tenant,
            TenancyId = tenancy.Id,
            CategoryId = category.Id,
            Category = category,
            Description = "Severe pipe leak in bathroom",
            RequestType = "NORMAL",
            Priority = "High",
            Status = "Submitted",
            CreatedAt = DateTime.UtcNow
        };

        var workerUser = new User { Id = 300, FullName = "Technician Mike", Email = "mike@worker.com", RoleId = 4, IsActive = true };
        var worker = new Worker
        {
            Id = 300,
            UserId = workerUser.Id,
            User = workerUser,
            VerificationStatus = verificationStatus,
            IsAvailable = true,
            HourlyRate = hourlyRate,
            Skills = new List<WorkerSkill>
            {
                new WorkerSkill { Id = 1, WorkerId = 300, SkillName = workerSkill }
            },
            ServiceAreas = new List<ServiceArea>
            {
                new ServiceArea { Id = 1, WorkerId = 300, City = city, RadiusKm = 25.0, Latitude = 6.9271, Longitude = 79.8612 }
            },
            Availabilities = new List<WorkerAvailability>
            {
                new WorkerAvailability
                {
                    Id = 1,
                    WorkerId = 300,
                    DayOfWeek = DayOfWeek.Monday,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(18, 0, 0),
                    IsActive = true
                },
                new WorkerAvailability
                {
                    Id = 2,
                    WorkerId = 300,
                    DayOfWeek = DayOfWeek.Tuesday,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(18, 0, 0),
                    IsActive = true
                },
                new WorkerAvailability
                {
                    Id = 3,
                    WorkerId = 300,
                    DayOfWeek = DayOfWeek.Wednesday,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(18, 0, 0),
                    IsActive = true
                }
            },
            WorkOrders = new List<WorkOrder>()
        };

        context.Users.AddRange(ownerUser, tenantUser, workerUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);
        context.MaintenanceCategories.Add(category);
        context.MaintenanceRequests.Add(request);
        context.Workers.Add(worker);
        context.SaveChanges();

        return (request, worker);
    }

    [Fact]
    public async Task ValidationSafetyAgent_ValidTechnician_ReturnsPassWithLowRisk()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_ValidTechnician");
        var (request, worker) = SeedBaseData(context);

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            WorkerName = worker.User!.FullName,
            SuggestedDateTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc), // Monday 10:00 AM
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            DetectedProblem = "Pipe leak",
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "HIGH",
            SafetyConcern = "NONE",
            Confidence = 0.95m
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Equal(ValidationStatus.Pass, output.Status);
        Assert.True(output.RiskScore < 30.0, $"Expected low risk score but got {output.RiskScore}");
        Assert.Empty(output.Violations);
        Assert.Contains(output.PassedRules, r => r.Contains("Pillar 1"));
        Assert.Contains(output.PassedRules, r => r.Contains("Pillar 2"));
        Assert.Contains(output.PassedRules, r => r.Contains("Pillar 3"));
    }

    [Fact]
    public async Task ValidationSafetyAgent_UnverifiedTechnician_ReturnsFailWithHighRisk()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_UnverifiedTechnician");
        var (request, worker) = SeedBaseData(
            context,
            verificationStatus: WorkerVerificationStatus.PendingVerification);

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc),
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "NORMAL"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Equal(ValidationStatus.Fail, output.Status);
        Assert.True(output.RiskScore >= 90.0, $"Expected failure risk >= 90 but got {output.RiskScore}");
        Assert.NotEmpty(output.Violations);
        Assert.Contains(output.Violations, v => v.Contains("verified", StringComparison.OrdinalIgnoreCase) || v.Contains("verification", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ValidationSafetyAgent_SkillMismatch_ProducesBlockingViolation()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_SkillMismatch");
        var (request, worker) = SeedBaseData(
            context,
            categoryName: "Electrical",
            workerSkill: "Carpentry");

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc),
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "ELECTRICAL",
            RequiredSkill = "Electrician",
            Priority = "HIGH"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Equal(ValidationStatus.Fail, output.Status);
        Assert.NotEmpty(output.Violations);
        Assert.Contains(output.Violations, v => v.Contains("skills", StringComparison.OrdinalIgnoreCase) || v.Contains("category", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ValidationSafetyAgent_DoubleBookingConflict_ReturnsRevisionRequired()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_DoubleBooking");
        var (request, worker) = SeedBaseData(context);

        var conflictingTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc); // Monday 10:00

        // Create an overlapping active work order
        var existingOrder = new WorkOrder
        {
            Id = 501,
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            Status = WorkOrderStatus.Assigned,
            ScheduledDate = conflictingTime.AddMinutes(30), // Overlaps within 2-hour window
            CreatedAt = DateTime.UtcNow
        };
        context.WorkOrders.Add(existingOrder);
        context.SaveChanges();

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = conflictingTime,
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "NORMAL"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Equal(ValidationStatus.RevisionRequired, output.Status);
        Assert.True(output.RiskScore >= 50.0);
        Assert.Contains("conflict", output.Summary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidationSafetyAgent_EmergencyWithBusyWorker_ReturnsRevisionRequired()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_EmergencyBusyWorker");
        var (request, worker) = SeedBaseData(context);

        // Worker already has an InProgress job
        var activeOrder = new WorkOrder
        {
            Id = 502,
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            Status = WorkOrderStatus.InProgress,
            ScheduledDate = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow
        };
        context.WorkOrders.Add(activeOrder);
        context.SaveChanges();

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = DateTime.UtcNow.AddMinutes(30),
            IsEmergency = true,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "EMERGENCY",
            EmergencyClass = "LIFE_SAFETY_EMERGENCY",
            SafetyConcern = "Gas odor near boiler"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Equal(ValidationStatus.RevisionRequired, output.Status);
        Assert.Contains(output.Warnings, w => w.Contains("active job") || w.Contains("unburdened"));
    }

    [Fact]
    public async Task ValidationSafetyAgent_ExorbitantHourlyRate_AddsWarningFlag()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_HighRate");
        var (request, worker) = SeedBaseData(
            context,
            hourlyRate: 25000m); // Very high rate

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc),
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "NORMAL"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 1);

        // Assert
        Assert.NotNull(output);
        Assert.Contains(output.Warnings, w => w.Contains("deviates") || w.Contains("rate"));
    }

    [Fact]
    public async Task ValidationSafetyAgent_PersistsValidationResultInDatabase()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("A4_PersistValidationResult");
        var (request, worker) = SeedBaseData(context);

        var agent = new ValidationSafetyAgent(context);

        var matchResult = new Agent3Result
        {
            MaintenanceRequestId = request.Id,
            WorkerId = worker.Id,
            SuggestedDateTime = new DateTime(2026, 10, 5, 10, 0, 0, DateTimeKind.Utc),
            IsEmergency = false,
            Result = "MatchFound"
        };

        var analysisOutput = new AnalysisOutput
        {
            Category = "PLUMBING",
            RequiredSkill = "Plumbing",
            Priority = "NORMAL"
        };

        // Act
        var output = await agent.ExecuteAsync(matchResult, analysisOutput, request.Id, 42);

        // Assert
        var savedResult = await context.ValidationResults
            .FirstOrDefaultAsync(v => v.MaintenanceRequestId == request.Id);

        Assert.NotNull(savedResult);
        Assert.Equal(worker.Id, savedResult.WorkerId);
        Assert.Equal(ValidationStatus.Pass, savedResult.Status);
        Assert.False(string.IsNullOrWhiteSpace(savedResult.DetailsJson));

        var parsedMemory = JsonSerializer.Deserialize<Agent4Memory>(savedResult.DetailsJson);
        Assert.NotNull(parsedMemory);
        Assert.Equal(42, parsedMemory.WorkflowId);
        Assert.NotNull(parsedMemory.VerificationCheck);
        Assert.NotNull(parsedMemory.SkillMatchCheck);
        Assert.NotNull(parsedMemory.GeoCoverageCheck);
        Assert.NotNull(parsedMemory.ScheduleConflictCheck);
        Assert.NotNull(parsedMemory.SafetyComplianceCheck);
        Assert.NotNull(parsedMemory.RateCheck);
    }
}
