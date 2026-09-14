using SmartProperty.Api.DTOs.Admin;

namespace SmartProperty.Api.Interfaces;

public interface IAdminUserService
{
    Task<PagedUsersResponseDto> GetUsersAsync(
        string? search,
        string? role,
        bool? isActive,
        int page,
        int pageSize);

    Task<bool> SetUserStatusAsync(int userId, bool isActive);
}