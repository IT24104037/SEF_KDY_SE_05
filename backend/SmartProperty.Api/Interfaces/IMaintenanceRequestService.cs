using SmartProperty.Api.DTOs.Maintenance;

namespace SmartProperty.Api.Interfaces;

public interface IMaintenanceRequestService
{
    Task<MaintenanceRequestDto> CreateAsync(
        int currentUserId,
        CreateMaintenanceRequestDto dto);

    Task<PagedMaintenanceRequestsDto> GetAllAsync(
        int currentUserId,
        string currentUserRole,
        string? search,
        string? status,
        string? requestType,
        string? priority,
        int? propertyId,
        string sortBy,
        string sortDirection,
        int page,
        int pageSize);

    Task<MaintenanceRequestDto?> GetByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole);

    Task<MaintenanceRequestDto?> UpdateAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        UpdateMaintenanceRequestDto dto);

    Task<MaintenanceRequestDto?> UpdateStatusAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        UpdateMaintenanceStatusDto dto);

    Task<List<MaintenanceStatusHistoryDto>?> GetHistoryAsync(
        int id,
        int currentUserId,
        string currentUserRole);


        Task<bool> ArchiveCompletedRequestAsync(
            int id,
            int currentUserId,
            string currentUserRole);


            Task<PagedMaintenanceRequestsDto> GetHistoryRequestsAsync(
                int currentUserId,
                string currentUserRole,
                string? search,
                string? status,
                string? requestType,
                int page,
                int pageSize);
}