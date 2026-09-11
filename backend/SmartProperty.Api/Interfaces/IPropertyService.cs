using SmartProperty.Api.DTOs.Properties;

namespace SmartProperty.Api.Interfaces;

public interface IPropertyService
{
    Task<PropertyResponseDto?> CreatePropertyAsync(
        int userId,
        CreatePropertyDto request);

    Task<List<PropertyResponseDto>> GetMyPropertiesAsync(
        int userId);

    Task<PropertyResponseDto?> GetPropertyByIdAsync(
        int userId,
        int propertyId);

    Task<PropertyResponseDto?> UpdatePropertyAsync(
        int userId,
        int propertyId,
        UpdatePropertyDto request);

    Task<bool> ArchivePropertyAsync(
        int userId,
        int propertyId);

    Task<UnitResponseDto?> CreateUnitAsync(
        int userId,
        int propertyId,
        CreateUnitDto request);

    Task<List<UnitResponseDto>> GetUnitsAsync(
        int userId,
        int propertyId);

    Task<UnitResponseDto?> GetUnitByIdAsync(
        int userId,
        int propertyId,
        int unitId);
}