using SmartProperty.Api.DTOs.Workers;

namespace SmartProperty.Api.Interfaces;

public interface IExternalMaintenanceService
{
    Task<ExternalArrangementResponseDto> CreateArrangementAsync(
        int maintenanceRequestId,
        CreateExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole);

    Task<ExternalArrangementResponseDto> UpdateArrangementAsync(
        int id,
        UpdateExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole);

    Task<ExternalArrangementResponseDto> ConfirmArrangementAsync(
        int id,
        ConfirmExternalArrangementDto dto,
        int currentUserId,
        string currentUserRole);

    Task<List<ExternalArrangementResponseDto>> GetArrangementsAsync(
        int currentUserId,
        string currentUserRole,
        int? maintenanceRequestId = null);

    Task<ExternalArrangementResponseDto?> GetArrangementByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole);
}
