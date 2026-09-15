using SmartProperty.Api.DTOs.Maintenance;

namespace SmartProperty.Api.Interfaces;

public interface IMaintenanceCategoryService
{
    Task<List<MaintenanceCategoryDto>> GetAllAsync(
        bool includeInactive = false);

    Task<MaintenanceCategoryDto> CreateAsync(
        CreateMaintenanceCategoryDto dto);

    Task<MaintenanceCategoryDto?> UpdateAsync(
        int id,
        UpdateMaintenanceCategoryDto dto);
}