using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        var context =
            services.GetRequiredService<AppDbContext>();

        var passwordHasher =
            services.GetRequiredService<IPasswordHasher<User>>();

        string? email = configuration["SeedAdmin:Email"];
        string? password = configuration["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        bool adminExists =
            await context.Users.AnyAsync(u => u.Email == email);

        if (adminExists)
        {
            return;
        }

        var adminRole =
            await context.Roles
                .FirstAsync(r => r.Name == "Admin");

        var admin = new User
        {
            FullName = "Site Administrator",
            Email = email,
            RoleId = adminRole.Id,
            IsActive = true
        };

        admin.PasswordHash =
            passwordHasher.HashPassword(admin, password);

        context.Users.Add(admin);

        await context.SaveChangesAsync();
    }

    public static async Task SeedTestOwnerAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        var context = services.GetRequiredService<AppDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

        string? email = configuration["SeedTestOwner:Email"];
        string? password = configuration["SeedTestOwner:Password"];

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        bool ownerExists = await context.Users.AnyAsync(u => u.Email == email);
        if (ownerExists)
        {
            return;
        }

        var ownerRole = await context.Roles
            .FirstAsync(r => r.Name == "PropertyOwner");

        var owner = new User
        {
            FullName = "Test Property Owner",
            Email = email,
            RoleId = ownerRole.Id,
            IsActive = true
        };

        owner.PasswordHash = passwordHasher.HashPassword(owner, password);
        context.Users.Add(owner);
        await context.SaveChangesAsync();
    }
}