using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartProperty.Api.DTOs.Auth;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email/mobile or password."
            });
        }

        return Ok(result);
    }
    //registration endpoint
    [HttpPost("register-owner")]
    public async Task<IActionResult> RegisterOwner(
        RegisterOwnerDto request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Registration request body is required." });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { message = "Full name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var email = request.Email.Trim();
        if (!new EmailAddressAttribute().IsValid(email))
        {
            return BadRequest(new { message = "Invalid email format." });
        }

        if (string.IsNullOrWhiteSpace(request.Mobile))
        {
            return BadRequest(new { message = "Mobile number is required." });
        }

        var mobile = request.Mobile.Trim();
        if (mobile.Length != 10 || !mobile.All(char.IsDigit))
        {
            return BadRequest(new { message = "Mobile number must contain exactly 10 digits." });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Password is required." });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { message = "Password must be at least 6 characters." });
        }

        if (string.IsNullOrWhiteSpace(request.PropertyName))
        {
            return BadRequest(new { message = "Property name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.PropertyAddress))
        {
            return BadRequest(new { message = "Property address is required." });
        }

        if (string.IsNullOrWhiteSpace(request.DocumentType))
        {
            return BadRequest(new { message = "Document type is required." });
        }

        if (string.IsNullOrWhiteSpace(request.DocumentUrl))
        {
            return BadRequest(new { message = "Document URL is required." });
        }

        var result = await _authService.RegisterOwnerAsync(request);

        if (!result)
        {
            return BadRequest(new
            {
                message = "An account with the provided email or mobile already exists."
            });
        }

        return Ok(new
        {
            message = "Owner registration submitted successfully."
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId = User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,

            name = User.Identity?.Name,

            role = User.FindFirst(
                System.Security.Claims.ClaimTypes.Role)?.Value
        });
    }
}