using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Maintenance;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class MaintenanceCategoryService
    : IMaintenanceCategoryService
{
    private readonly AppDbContext _context;

    public MaintenanceCategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<MaintenanceCategoryDto>> GetAllAsync(
        bool includeInactive = false)
    {
        var query = _context.MaintenanceCategories
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query
            .OrderBy(x => x.Name)
            .Select(x => new MaintenanceCategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }

    public async Task<MaintenanceCategoryDto> CreateAsync(
        CreateMaintenanceCategoryDto dto)
    {
        var name = dto.Name.Trim();

        var exists = await _context.MaintenanceCategories
            .AnyAsync(x => x.Name.ToLower() == name.ToLower());

        if (exists)
        {
            throw new InvalidOperationException(
                "A maintenance category with this name already exists.");
        }

        var category = new MaintenanceCategory
        {
            Name = name,
            Description = dto.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MaintenanceCategories.Add(category);

        await _context.SaveChangesAsync();

        return new MaintenanceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive
        };
    }

    public async Task<MaintenanceCategoryDto?> UpdateAsync(
        int id,
        UpdateMaintenanceCategoryDto dto)
    {
        var category = await _context.MaintenanceCategories
            .FindAsync(id);

        if (category == null)
            return null;

        var name = dto.Name.Trim();

        var duplicate = await _context.MaintenanceCategories
            .AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() == name.ToLower());

        if (duplicate)
        {
            throw new InvalidOperationException(
                "A maintenance category with this name already exists.");
        }

        category.Name = name;
        category.Description = dto.Description?.Trim();
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new MaintenanceCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive
        };
    }
}