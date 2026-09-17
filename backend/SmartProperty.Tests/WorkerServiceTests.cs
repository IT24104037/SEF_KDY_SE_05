using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Services;
using Xunit;

namespace SmartProperty.Tests;

public class WorkerServiceTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);

        // Seed roles
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
    public async Task RegisterWorkerAsync_CreatesUserAndWorker_WithPendingVerification()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WorkerTest_Register_Success");
        var passwordHasher = new PasswordHasher<User>();
        var service = new WorkerService(context, passwordHasher);

        var dto = new RegisterWorkerDto
        {
            FullName = "Kasun Perera",
            Email = "kasun@example.com",
            Mobile = "+94771122334",
            Password = "Password123!",
            Skills = new List<string> { "Plumbing", "Electrical" },
            ServiceArea = "Colombo 03",
            ProofDocumentName = "license.pdf"
        };

        // Act
        var result = await service.RegisterWorkerAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Kasun Perera", result.FullName);
        Assert.Equal("PendingVerification", result.VerificationStatus);
        Assert.Equal(2, result.Skills.Count);
        Assert.Equal("Colombo 03", result.ServiceArea);

        var savedUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "kasun@example.com");
        Assert.NotNull(savedUser);
        Assert.Equal(4, savedUser.RoleId); // MaintenanceWorker role
    }

    [Fact]
    public async Task RegisterWorkerAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WorkerTest_Register_Duplicate");
        var passwordHasher = new PasswordHasher<User>();
        var service = new WorkerService(context, passwordHasher);

        var dto = new RegisterWorkerDto
        {
            FullName = "First Worker",
            Email = "duplicate@example.com",
            Mobile = "+94771111111",
            Password = "Password123!",
            Skills = new List<string> { "Plumbing" },
            ServiceArea = "Kandy",
            ProofDocumentName = "doc.pdf"
        };
        await service.RegisterWorkerAsync(dto);

        var duplicateDto = new RegisterWorkerDto
        {
            FullName = "Second Worker",
            Email = "duplicate@example.com",
            Mobile = "+94772222222",
            Password = "Password123!",
            Skills = new List<string> { "Electrical" },
            ServiceArea = "Colombo",
            ProofDocumentName = "doc2.pdf"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterWorkerAsync(duplicateDto));
    }

    [Fact]
    public async Task VerifyWorkerAsync_AdminApproves_SetsStatusToVerified()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WorkerTest_Verify_Approve");
        var passwordHasher = new PasswordHasher<User>();
        var service = new WorkerService(context, passwordHasher);

        var registerDto = new RegisterWorkerDto
        {
            FullName = "Rohan Silva",
            Email = "rohan@example.com",
            Mobile = "+94773334455",
            Password = "Password123!",
            Skills = new List<string> { "HVAC" },
            ServiceArea = "Galle",
            ProofDocumentName = "hvac-license.pdf"
        };
        var registered = await service.RegisterWorkerAsync(registerDto);

        var verifyDto = new VerifyWorkerDto
        {
            Decision = "Verified"
        };

        // Act
        var verified = await service.VerifyWorkerAsync(registered.Id, verifyDto, adminUserId: 1);

        // Assert
        Assert.Equal("Verified", verified.VerificationStatus);
        Assert.NotNull(verified.VerifiedAt);
        Assert.Null(verified.RejectionReason);
    }

    [Fact]
    public async Task VerifyWorkerAsync_AdminRejects_SetsStatusToRejectedWithReason()
    {
        // Arrange
        using var context = CreateInMemoryDbContext("WorkerTest_Verify_Reject");
        var passwordHasher = new PasswordHasher<User>();
        var service = new WorkerService(context, passwordHasher);

        var registerDto = new RegisterWorkerDto
        {
            FullName = "Sunil Shantha",
            Email = "sunil@example.com",
            Mobile = "+94774445566",
            Password = "Password123!",
            Skills = new List<string> { "Carpentry" },
            ServiceArea = "Matara",
            ProofDocumentName = "doc.png"
        };
        var registered = await service.RegisterWorkerAsync(registerDto);

        var verifyDto = new VerifyWorkerDto
        {
            Decision = "Rejected",
            RejectionReason = "Certificate document is illegible or expired."
        };

        // Act
        var rejected = await service.VerifyWorkerAsync(registered.Id, verifyDto, adminUserId: 1);

        // Assert
        Assert.Equal("Rejected", rejected.VerificationStatus);
        Assert.Equal("Certificate document is illegible or expired.", rejected.RejectionReason);
        Assert.Null(rejected.VerifiedAt);
    }
}

