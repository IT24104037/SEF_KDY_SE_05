using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Identity;
using Xunit;

namespace SmartProperty.Tests.Security;

/// <summary>
/// In-memory WebApplicationFactory test host for Member 4 Security Testing (SEC-01 & SEC-02).
/// Replaces relational PostgreSQL with EF Core InMemory Database and exercises ASP.NET Core
/// HTTP authentication and role-based authorization middleware in isolation without database migrations.
/// </summary>
public class SecurityTestWebApplicationFactory : WebApplicationFactory<Program>
{
    static SecurityTestWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            string dbName = $"SecurityTests_{Guid.NewGuid()}";
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName);
            });

            // Ensure baseline Roles exist in the in-memory test database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (!db.Roles.Any())
            {
                db.Roles.AddRange(
                    new Role { Id = 1, Name = "Admin" },
                    new Role { Id = 2, Name = "PropertyOwner" },
                    new Role { Id = 3, Name = "Tenant" },
                    new Role { Id = 4, Name = "MaintenanceWorker" }
                );
                db.SaveChanges();
            }
        });
    }

    /// <summary>
    /// Generates a valid test JWT signed with the application's configured Development secret key.
    /// </summary>
    public string GenerateTestJwtToken(int userId, string email, string role)
    {
        using var scope = Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        string key = config["Jwt:Key"] ?? "development-only-key-change-before-production-1234567890";
        string issuer = config["Jwt:Issuer"] ?? "SmartProperty.Api";
        string audience = config["Jwt:Audience"] ?? "SmartProperty.Client";

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.Email, email)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class SecurityAuthorizationTests : IClassFixture<SecurityTestWebApplicationFactory>
{
    private readonly SecurityTestWebApplicationFactory _factory;

    public SecurityAuthorizationTests(SecurityTestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// SEC-01: Unauthenticated API Access.
    /// Verifies that an HTTP request without an Authorization header to a protected endpoint
    /// returns HTTP 401 Unauthorized and does not expose protected application data.
    /// </summary>
    [Fact]
    public async Task SEC_01_UnauthenticatedAccess_Returns401Unauthorized()
    {
        // Arrange: Create HTTP client without Authorization header
        var client = _factory.CreateClient();

        // Act: Request protected PropertyOwner endpoint GET /api/properties
        var response = await client.GetAsync("/api/properties");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.DoesNotContain("Lotus Grove", content);
        Assert.DoesNotContain("12 Galle Rd", content);
    }

    /// <summary>
    /// SEC-02: Role-Based Authorization.
    /// Verifies that an authenticated request with a valid JWT but unauthorized role (Tenant)
    /// to a restricted PropertyOwner endpoint returns HTTP 403 Forbidden and prevents operation execution.
    /// </summary>
    [Fact]
    public async Task SEC_02_RoleBasedAuthorization_TenantAccessingPropertyOwnerEndpoint_Returns403Forbidden()
    {
        // Arrange: Authenticate test user with valid JWT carrying role "Tenant"
        var client = _factory.CreateClient();
        string tenantToken = _factory.GenerateTestJwtToken(200, "bob@tenant.com", "Tenant");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenantToken);

        // Act: Request restricted PropertyOwner endpoint GET /api/properties
        var response = await client.GetAsync("/api/properties");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.DoesNotContain("Lotus Grove", content);
    }
}
