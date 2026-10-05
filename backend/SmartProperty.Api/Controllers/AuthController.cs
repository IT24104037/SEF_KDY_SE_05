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