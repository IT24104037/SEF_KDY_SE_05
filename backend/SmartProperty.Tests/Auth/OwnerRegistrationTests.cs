using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Controllers;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests.Auth;

public class OwnerRegistrationTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var context = new AppDbContext(options);

        // Seed default PropertyOwner role
        if (!context.Roles.Any(r => r.Name == "PropertyOwner"))
        {
            context.Roles.Add(new Role { Id = 2, Name = "PropertyOwner" });
            context.SaveChanges();
        }

        return context;
    }

    private static RegisterOwnerDto CreateValidRegisterDto()
    {
        return new RegisterOwnerDto
        {
            FullName = "Jane Owner",
            Email = "jane.owner@example.com",
            Mobile = "0771234567",
            Password = "Password123",
            PropertyName = "Sunrise Villa",
            PropertyAddress = "123 Main Street",
            DocumentType = "Deed",
            DocumentUrl = "https://example.com/deed.pdf"
        };
    }

    [Fact]
    public async Task RegisterOwner_MissingEmail_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Email = "";

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_InvalidEmail_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Email = "invalid-email-format";

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_MissingMobile_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Mobile = "";

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_MobileContainingLetters_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Mobile = "077123456A";

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_MobileContainingNonNumericCharacters_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Mobile = "077-123456";

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_MobileFewerThan10Digits_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Mobile = "077123456"; // 9 digits

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_MobileMoreThan10Digits_ReturnsBadRequest()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();
        dto.Mobile = "07712345678"; // 11 digits

        var result = await controller.RegisterOwner(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task RegisterOwner_ValidEmailAnd10DigitMobile_ReturnsSuccess()
    {
        using var context = CreateDbContext(Guid.NewGuid().ToString());
        var authService = new AuthService(context, new PasswordHasher<User>(), new TestConfiguration());
        var controller = new AuthController(authService);

        var dto = CreateValidRegisterDto();

        var result = await controller.RegisterOwner(dto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}

// Minimal TestConfiguration for IConfiguration dependency in AuthService tests
internal class TestConfiguration : Microsoft.Extensions.Configuration.IConfiguration
{
    private readonly Dictionary<string, string?> _values = new()
    {
        { "Jwt:Key", "super_secret_jwt_key_for_testing_purposes_only_123456" },
        { "Jwt:Issuer", "SmartPropertyTest" },
        { "Jwt:Audience", "SmartPropertyTestApp" }
    };

    public string? this[string key]
    {
        get => _values.TryGetValue(key, out var val) ? val : null;
        set => _values[key] = value;
    }

    public Microsoft.Extensions.Configuration.IConfigurationSection GetSection(string key) => throw new NotImplementedException();
    public IEnumerable<Microsoft.Extensions.Configuration.IConfigurationSection> GetChildren() => throw new NotImplementedException();
    public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken() => throw new NotImplementedException();
}
