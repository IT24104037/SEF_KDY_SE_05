using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Tools;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.AgenticAI;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Services;
using Xunit;

namespace SmartProperty.Tests.AgenticAI;

public class Agent1Tests
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

    private static void SeedBaseData(AppDbContext context, int requestId = 1, string categoryName = "Plumbing")
    {
        var ownerUser = new User { Id = 10, FullName = "Owner User", Email = "owner@test.com", RoleId = 2 };
        var tenantUser = new User { Id = 20, FullName = "Tenant User", Email = "tenant@test.com", RoleId = 3 };
        var owner = new PropertyOwner { Id = 100, UserId = ownerUser.Id, User = ownerUser };
        var property = new Property { Id = 200, Name = "Ocean Breeze Apartments", Address = "123 Beach Rd", City = "Colombo", PropertyOwnerId = owner.Id };
        var unit = new Unit { Id = 300, PropertyId = property.Id, UnitLabel = "A-101" };
        var tenant = new Tenant { Id = 400, UserId = tenantUser.Id, FullName = "Tenant User", PropertyId = property.Id, UnitId = unit.Id };
        var tenancy = new Tenancy { Id = 500, TenantId = tenant.Id, UnitId = unit.Id, Status = TenancyStatus.Active };
        var category = new MaintenanceCategory { Id = 600, Name = categoryName, Description = "Water and pipe fixes" };

        context.Users.AddRange(ownerUser, tenantUser);
        context.PropertyOwners.Add(owner);
        context.Properties.Add(property);
        context.Units.Add(unit);
        context.Tenants.Add(tenant);
        context.Tenancies.Add(tenancy);
        context.MaintenanceCategories.Add(category);

        var maintRequest = new MaintenanceRequest
        {
            Id = requestId,
            TenantId = tenant.Id,
            TenancyId = tenancy.Id,
            PropertyId = property.Id,
            UnitId = unit.Id,
            CategoryId = category.Id,
            Category = category,
            Description = "Leaking water pipe under the kitchen sink",
            RequestType = "NORMAL",
            Status = "Submitted",
            Priority = "High",
            CreatedAt = DateTime.UtcNow
        };

        context.MaintenanceRequests.Add(maintRequest);
        context.SaveChanges();
    }

    private static void SetControllerUser(ControllerBase controller, int userId, string role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_ValidRequest_CreatesWorkflowAndSteps()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_Valid");
        SeedBaseData(db, requestId: 101, categoryName: "Plumbing");

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act
        var response = await service.StartPlannerWorkflowAsync(101, 10, "PropertyOwner");

        // Assert
        Assert.NotNull(response);
        Assert.Equal(101, response.MaintenanceRequestId);
        Assert.Equal("Running", response.Status);
        Assert.Equal("Agent 1 Complete - Pending Downstream Analysis", response.CurrentStep);
        Assert.Single(response.Steps);
        Assert.Equal("Planner & Coordinator", response.Steps[0].StepName);
        Assert.Equal("Completed", response.Steps[0].Status);
        Assert.Single(response.ExecutionLogs);
        Assert.Equal("PlannerCoordinatorAgent", response.ExecutionLogs[0].AgentName);
        Assert.NotNull(response.PlannerOutput);
        Assert.Equal("Plumbing", response.PlannerOutput.RequiredTrade);
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_InvalidRequestId_ThrowsKeyNotFoundException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_Invalid");
        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.StartPlannerWorkflowAsync(99999, 10, "PropertyOwner"));
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_DuplicateActiveWorkflow_ReturnsExistingWorkflow()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_Duplicate");
        SeedBaseData(db, requestId: 102);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act 1: First call
        var firstResponse = await service.StartPlannerWorkflowAsync(102, 10, "PropertyOwner");

        // Act 2: Second call
        var secondResponse = await service.StartPlannerWorkflowAsync(102, 10, "PropertyOwner");

        // Assert
        Assert.Equal(firstResponse.Id, secondResponse.Id);
        Assert.Equal(1, db.AgentWorkflows.Count(w => w.MaintenanceRequestId == 102));
    }

    [Fact]
    public async Task GetWorkflowByIdAsync_ExistingWorkflow_ReturnsWorkflowResponseDto()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetById_Exists");
        SeedBaseData(db, requestId: 103);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        var created = await service.StartPlannerWorkflowAsync(103, 10, "PropertyOwner");

        // Act
        var result = await service.GetWorkflowByIdAsync(created.Id, 10, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(created.Id, result.Id);
        Assert.Equal(103, result.MaintenanceRequestId);
    }

    [Fact]
    public async Task GetWorkflowByIdAsync_NonExistingWorkflow_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetById_NotFound");
        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act
        var result = await service.GetWorkflowByIdAsync(999, 10, "PropertyOwner");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetWorkflowByRequestIdAsync_ExistingWorkflow_ReturnsWorkflowResponseDto()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetByRequest_Exists");
        SeedBaseData(db, requestId: 104);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        await service.StartPlannerWorkflowAsync(104, 10, "PropertyOwner");

        // Act
        var result = await service.GetWorkflowByRequestIdAsync(104, 10, "PropertyOwner");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(104, result.MaintenanceRequestId);
    }

    [Fact]
    public async Task GetWorkflowLogsAsync_ExistingWorkflow_ReturnsLogsList()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetLogs_Exists");
        SeedBaseData(db, requestId: 105);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        var created = await service.StartPlannerWorkflowAsync(105, 10, "PropertyOwner");

        // Act
        var logs = await service.GetWorkflowLogsAsync(created.Id, 10, "PropertyOwner");

        // Assert
        Assert.NotNull(logs);
        Assert.Single(logs);
        Assert.Equal("PlannerCoordinatorAgent", logs[0].AgentName);
        Assert.Equal("Completed", logs[0].Status);
    }

    // =========================================================
    // OWNERSHIP & AUTHORIZATION TESTS
    // =========================================================

    [Fact]
    public async Task StartPlannerWorkflowAsync_UnauthorizedPropertyOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_UnauthOwner");
        SeedBaseData(db, requestId: 201);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act & Assert: User ID 999 is a PropertyOwner, but does NOT own property 200
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.StartPlannerWorkflowAsync(201, currentUserId: 999, currentUserRole: "PropertyOwner"));
    }

    [Fact]
    public async Task GetWorkflowByIdAsync_UnauthorizedPropertyOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetById_UnauthOwner");
        SeedBaseData(db, requestId: 202);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        var created = await service.StartPlannerWorkflowAsync(202, currentUserId: 10, currentUserRole: "PropertyOwner");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetWorkflowByIdAsync(created.Id, currentUserId: 999, currentUserRole: "PropertyOwner"));
    }

    [Fact]
    public async Task GetWorkflowByRequestIdAsync_UnauthorizedPropertyOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetByRequest_UnauthOwner");
        SeedBaseData(db, requestId: 203);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        await service.StartPlannerWorkflowAsync(203, currentUserId: 10, currentUserRole: "PropertyOwner");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetWorkflowByRequestIdAsync(203, currentUserId: 999, currentUserRole: "PropertyOwner"));
    }

    [Fact]
    public async Task GetWorkflowLogsAsync_UnauthorizedPropertyOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_GetLogs_UnauthOwner");
        SeedBaseData(db, requestId: 204);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        var created = await service.StartPlannerWorkflowAsync(204, currentUserId: 10, currentUserRole: "PropertyOwner");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetWorkflowLogsAsync(created.Id, currentUserId: 999, currentUserRole: "PropertyOwner"));
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_TenantOwnsRequest_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_TenantValid");
        SeedBaseData(db, requestId: 205);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act: TenantUser has UserId = 20
        var response = await service.StartPlannerWorkflowAsync(205, currentUserId: 20, currentUserRole: "Tenant");

        // Assert
        Assert.NotNull(response);
        Assert.Equal(205, response.MaintenanceRequestId);
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_UnauthorizedTenant_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_TenantUnauth");
        SeedBaseData(db, requestId: 206);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act & Assert: Tenant with UserId 888 did not create request 206
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.StartPlannerWorkflowAsync(206, currentUserId: 888, currentUserRole: "Tenant"));
    }

    [Fact]
    public async Task StartPlannerWorkflowAsync_AdminRole_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Start_Admin");
        SeedBaseData(db, requestId: 207);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);

        // Act: Admin can access any request
        var response = await service.StartPlannerWorkflowAsync(207, currentUserId: 777, currentUserRole: "Admin");

        // Assert
        Assert.NotNull(response);
        Assert.Equal(207, response.MaintenanceRequestId);
    }

    // =========================================================
    // CONTROLLER TESTS
    // =========================================================

    [Fact]
    public async Task AgentWorkflowController_Start_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_Start_Valid");
        SeedBaseData(db, requestId: 106);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.StartWorkflow(new StartWorkflowDto { MaintenanceRequestId = 106 }, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var dto = Assert.IsType<WorkflowResponseDto>(okResult.Value);
        Assert.Equal(106, dto.MaintenanceRequestId);
    }

    [Fact]
    public async Task AgentWorkflowController_Start_Unauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_Start_Unauth");
        SeedBaseData(db, requestId: 106);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        // Controller Context is NOT set with user claims -> unauthenticated

        // Act
        var actionResult = await controller.StartWorkflow(new StartWorkflowDto { MaintenanceRequestId = 106 }, default);

        // Assert
        Assert.IsType<UnauthorizedResult>(actionResult);
    }

    [Fact]
    public async Task AgentWorkflowController_Start_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_Start_Forbid");
        SeedBaseData(db, requestId: 106);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 999, "PropertyOwner"); // User 999 does not own property

        // Act
        var actionResult = await controller.StartWorkflow(new StartWorkflowDto { MaintenanceRequestId = 106 }, default);

        // Assert
        Assert.IsType<ForbidResult>(actionResult);
    }

    [Fact]
    public async Task AgentWorkflowController_Start_InvalidRequestId_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_Start_NotFound");
        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.StartWorkflow(new StartWorkflowDto { MaintenanceRequestId = 9999 }, default);

        // Assert
        Assert.IsType<NotFoundObjectResult>(actionResult);
    }

    [Fact]
    public async Task AgentWorkflowController_Start_InvalidPayload_ReturnsBadRequest()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_Start_BadRequest");
        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.StartWorkflow(new StartWorkflowDto { MaintenanceRequestId = -1 }, default);

        // Assert
        Assert.IsType<BadRequestObjectResult>(actionResult);
    }

    [Fact]
    public async Task AgentWorkflowController_GetById_ExistingWorkflow_ReturnsOkResult()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_GetById_Ok");
        SeedBaseData(db, requestId: 107);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var created = await service.StartPlannerWorkflowAsync(107, 10, "PropertyOwner");

        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.GetById(created.Id, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var dto = Assert.IsType<WorkflowResponseDto>(okResult.Value);
        Assert.Equal(created.Id, dto.Id);
    }

    [Fact]
    public async Task AgentWorkflowController_GetByRequestId_ExistingRequest_ReturnsOkResult()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_GetByReq_Ok");
        SeedBaseData(db, requestId: 108);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        await service.StartPlannerWorkflowAsync(108, 10, "PropertyOwner");

        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.GetByRequestId(108, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var dto = Assert.IsType<WorkflowResponseDto>(okResult.Value);
        Assert.Equal(108, dto.MaintenanceRequestId);
    }

    [Fact]
    public async Task AgentWorkflowController_GetLogs_ExistingWorkflow_ReturnsOkResult()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Agent1_Controller_GetLogs_Ok");
        SeedBaseData(db, requestId: 109);

        var maintTool = new MaintenanceContextTool(db);
        var propTool = new PropertyContextTool(db);
        var agent = new PlannerCoordinatorAgent(maintTool, propTool);
        var service = new AgentWorkflowService(db, agent, NullLogger<AgentWorkflowService>.Instance);
        var created = await service.StartPlannerWorkflowAsync(109, 10, "PropertyOwner");

        var controller = new AgentWorkflowController(service, NullLogger<AgentWorkflowController>.Instance);
        SetControllerUser(controller, 10, "PropertyOwner");

        // Act
        var actionResult = await controller.GetLogs(created.Id, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var logs = Assert.IsType<List<AgentExecutionLogDto>>(okResult.Value);
        Assert.Single(logs);
        Assert.Equal("PlannerCoordinatorAgent", logs[0].AgentName);
    }
}
