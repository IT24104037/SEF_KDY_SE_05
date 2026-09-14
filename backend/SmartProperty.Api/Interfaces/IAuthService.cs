using SmartProperty.Api.DTOs.Auth;

namespace SmartProperty.Api.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);

    Task<bool> RegisterOwnerAsync(RegisterOwnerDto request);
}