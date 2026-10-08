using Microsoft.EntityFrameworkCore;
using Npgsql;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Identity;
using Xunit;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Tests;

public class Member1DatabaseIntegrationTests
{
    private static AppDbContext CreatePostgresContext()
    {
        var connectionString =
            Environment.GetEnvironmentVariable("QM_TEST_DB_CONNECTION");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "QM_TEST_DB_CONNECTION environment variable is not set.");
        }

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task M1_DB_01_DuplicateUserEmail_IsRejectedByPostgreSQL()
    {
        await using var context = CreatePostgresContext();

        await using var transaction =
            await context.Database.BeginTransactionAsync();

        try
        {
            var uniqueValue = Guid.NewGuid().ToString("N");

            var role = new Role
            {
                Name = $"QMRole_{uniqueValue[..8]}"
            };

            context.Roles.Add(role);
            await context.SaveChangesAsync();

            var duplicateEmail =
                $"qm-db-{uniqueValue}@example.com";

            var firstUser = new User
            {
                FullName = "QM Database Test User One",
                Email = duplicateEmail,
                Mobile = $"07{Random.Shared.Next(10000000, 99999999)}",
                PasswordHash = "QM_TEST_HASH",
                IsActive = true,
                RoleId = role.Id
            };

            context.Users.Add(firstUser);
            await context.SaveChangesAsync();

            var secondUser = new User
            {
                FullName = "QM Database Test User Two",
                Email = duplicateEmail,
                Mobile = $"06{Random.Shared.Next(10000000, 99999999)}",
                PasswordHash = "QM_TEST_HASH",
                IsActive = true,
                RoleId = role.Id
            };

            context.Users.Add(secondUser);

            var exception =
                await Assert.ThrowsAsync<DbUpdateException>(
                    async () => await context.SaveChangesAsync());

            var postgresException =
                Assert.IsType<PostgresException>(
                    exception.InnerException);

            Assert.Equal(
                PostgresErrorCodes.UniqueViolation,
                postgresException.SqlState);
        }
        finally
        {
            await transaction.RollbackAsync();
        }
    }

[Fact]
public async Task M1_DB_02_DuplicateActiveUnitLabel_IsRejectedByPostgreSQL()
{
    await using var context = CreatePostgresContext();

    await using var transaction =
        await context.Database.BeginTransactionAsync();

    try
    {
        var uniqueValue = Guid.NewGuid().ToString("N");

        var role = new Role
        {
            Name = $"QMOwnerRole_{uniqueValue[..8]}"
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync();

        var ownerUser = new User
        {
            FullName = "QM Database Property Owner",
            Email = $"qm-owner-{uniqueValue}@example.com",
            Mobile = null,
            PasswordHash = "QM_TEST_HASH",
            IsActive = true,
            RoleId = role.Id
        };

        context.Users.Add(ownerUser);
        await context.SaveChangesAsync();

        var propertyOwner = new PropertyOwner
        {
            UserId = ownerUser.Id
        };

        context.PropertyOwners.Add(propertyOwner);
        await context.SaveChangesAsync();

        var property = new Property
        {
            PropertyOwnerId = propertyOwner.Id,
            Name = $"QM Test Property {uniqueValue[..8]}",
            Address = "QM Test Address"
        };

        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var firstUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "QM-A1",
            IsArchived = false,
            IsDeleted = false
        };

        context.Units.Add(firstUnit);
        await context.SaveChangesAsync();

        var duplicateUnit = new Unit
        {
            PropertyId = property.Id,
            UnitLabel = "QM-A1",
            IsArchived = false,
            IsDeleted = false
        };

        context.Units.Add(duplicateUnit);

        var exception =
            await Assert.ThrowsAsync<DbUpdateException>(
                async () => await context.SaveChangesAsync());

        var postgresException =
            Assert.IsType<PostgresException>(
                exception.InnerException);

        Assert.Equal(
            PostgresErrorCodes.UniqueViolation,
            postgresException.SqlState);
    }
    finally
    {
        await transaction.RollbackAsync();
    }
}





}