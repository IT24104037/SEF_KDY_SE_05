using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Admin;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _context;

    public AdminUserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedUsersResponseDto> GetUsersAsync(
        string? search,
        string? role,
        bool? isActive,
        int page,
        int pageSize)
    {
        if (page < 1)
            page = 1;

        if (pageSize < 1 || pageSize > 100)
            pageSize = 10;

        var query = _context.Users
            .Include(u => u.Role)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var value = search.Trim();

            query = query.Where(u =>
                EF.Functions.ILike(u.FullName, $"%{value}%") ||
                (u.Email != null &&
                 EF.Functions.ILike(u.Email, $"%{value}%")) ||
                (u.Mobile != null &&
                 EF.Functions.ILike(u.Mobile, $"%{value}%")));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role.Name == role);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserListItemDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Mobile = u.Mobile,
                Role = u.Role.Name,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return new PagedUsersResponseDto
        {
            Users = users,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize)
        };
    }

    public async Task<bool> SetUserStatusAsync(
        int userId,
        bool isActive)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return false;

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }
}