using SmartProperty.Api.DTOs.Workers;

namespace SmartProperty.Api.Interfaces;

public interface IWorkOrderService
{
    Task<WorkOrderListResponseDto> GetWorkOrdersAsync(
        int currentUserId,
        string currentUserRole,
        string? status = null,
        int page = 1,
        int pageSize = 50);

    Task<WorkOrderResponseDto?> GetWorkOrderByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole);

    Task<WorkOrderResponseDto> UpdateWorkOrderStatusAsync(
        int id,
        UpdateWorkOrderStatusDto dto,
        int currentUserId,
        string currentUserRole);
}
