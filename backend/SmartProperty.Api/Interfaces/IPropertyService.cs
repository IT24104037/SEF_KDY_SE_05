using SmartProperty.Api.Common;
using SmartProperty.Api.DTOs.Properties;

namespace SmartProperty.Api.Interfaces;

public interface IPropertyService
{
    Task<PropertyResponseDto?> CreatePropertyAsync(
        int userId,
        CreatePropertyDto request);

    Task<PagedResult<PropertyResponseDto>> GetMyPropertiesAsync(
        int userId,
        PropertyQueryParameters query);

    Task<List<PropertyResponseDto>> GetArchivedPropertiesAsync(
        int userId);

    Task<PropertyResponseDto?> GetPropertyByIdAsync(
        int userId,
        int propertyId);

    Task<PropertyResponseDto?> UpdatePropertyAsync(
        int userId,
        int propertyId,
        UpdatePropertyDto request);

    Task<PropertyResponseDto?> ResubmitRejectedPropertyAsync(
        int userId,
        int propertyId,
        ResubmitPropertyDto request);

    Task<bool> ArchivePropertyAsync(
        int userId,
        int propertyId);

    Task<bool> RestorePropertyAsync(
        int userId,
        int propertyId);

    Task<UnitOperationResult> CreateUnitAsync(
        int userId,
        int propertyId,
        CreateUnitDto request);

    Task<PagedResult<UnitResponseDto>> GetUnitsAsync(
        int userId,
        int propertyId,
        UnitQueryParameters query);

    Task<UnitResponseDto?> GetUnitByIdAsync(
        int userId,
        int propertyId,
        int unitId);

    Task<UnitResponseDto?> UpdateUnitAsync(
        int userId,
        int propertyId,
        int unitId,
        UpdateUnitDto request);

    Task<bool> ArchiveUnitAsync(
        int userId,
        int propertyId,
        int unitId);

    Task<bool> SoftDeleteUnitAsync(
        int userId,
        int propertyId,
        int unitId);

    Task<List<UnitResponseDto>> GetArchivedUnitsAsync(
        int userId,
        int propertyId);

    Task<RestoreUnitOperationResult> RestoreUnitAsync(
        int userId,
        int propertyId,
        int unitId);

    Task<BulkUnitOperationResult> CreateBulkUnitsAsync(
        int userId,
        int propertyId,
        CreateBulkUnitsDto request);

    Task<OwnerDashboardDto?> GetOwnerDashboardAsync(
        int userId);

    Task<(byte[] FileBytes, string UnitLabel)?> ExportUnitTenancyHistoryAsync(
        int userId,
        int propertyId,
        int unitId);
}
