using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;

    public AuthService(
        AppDbContext context,
        IPasswordHasher<User> passwordHasher,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        string identifier = request.Identifier.Trim();

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                (u.Email != null &&
                 u.Email.ToLower() == identifier.ToLower()) ||
                u.Mobile == identifier);

        if (user == null || !user.IsActive)
        {
            return null;
        }

        var passwordResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password);

        if (passwordResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        string token = CreateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Role = user.Role?.Name ?? string.Empty
        };
    }

    private string CreateToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key is missing.");

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role?.Name ?? "")
        };

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        }

        var securityKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
    public async Task<bool> RegisterOwnerAsync(RegisterOwnerDto request)
{
    var email = request.Email?.Trim();
    var mobile = request.Mobile?.Trim();

    // Check whether the email or mobile is already registered.
    var existingUser = await _context.Users
        .FirstOrDefaultAsync(u =>
            (email != null && u.Email != null &&
             u.Email.ToLower() == email.ToLower()) ||
            (mobile != null && u.Mobile == mobile));

    if (existingUser != null)
    {
        return false;
    }

    // Get the PropertyOwner role.
    var ownerRole = await _context.Roles
        .FirstOrDefaultAsync(r => r.Name == "PropertyOwner");

    if (ownerRole == null)
    {
        throw new InvalidOperationException(
            "PropertyOwner role was not found.");
    }

    // Create the user.
    var user = new User
    {
        FullName = request.FullName.Trim(),
        Email = email,
        Mobile = mobile,
        IsActive = true,
        RoleId = ownerRole.Id
    };

    user.PasswordHash = _passwordHasher.HashPassword(
        user,
        request.Password);

    // Create the PropertyOwner profile.
    var propertyOwner = new SmartProperty.Api.Entities.Property.PropertyOwner
    {
        User = user,
        VerificationStatus =
            SmartProperty.Api.Entities.Property.OwnerVerificationStatus
                .PendingVerification
    };

    // Create the initial property from registration.
    var property = new SmartProperty.Api.Entities.Property.Property
    {
        PropertyOwner = propertyOwner,
        Name = request.PropertyName.Trim(),
        Address = request.PropertyAddress.Trim(),
        City = request.City?.Trim(),
        Description = request.PropertyDescription?.Trim(),
        Latitude = request.Latitude,
        Longitude = request.Longitude
    };

    // Save the ownership/management proof.
    var document =
        new SmartProperty.Api.Entities.Property.OwnerVerificationDocument
        {
            PropertyOwner = propertyOwner,
            DocumentType = request.DocumentType.Trim(),
            DocumentUrl = request.DocumentUrl.Trim()
        };

    _context.Users.Add(user);
    _context.PropertyOwners.Add(propertyOwner);
    _context.Properties.Add(property);
    _context.OwnerVerificationDocuments.Add(document);

    await _context.SaveChangesAsync();

    return true;
}
}