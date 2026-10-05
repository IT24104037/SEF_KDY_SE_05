using SmartProperty.Api.DTOs.Maintenance;

namespace SmartProperty.Api.Interfaces;

public interface IWorkerRecommendationService
{
    Task<RecommendationResponseDto> GetRecommendationAsync(
        int maintenanceRequestId,
        int currentUserId,
        string currentUserRole);

    Task<ApprovalResponseDto> ProcessApprovalAsync(
        int maintenanceRequestId,
        ApprovalRequestDto dto,
        int currentUserId,
        string currentUserRole);

    Task<List<RecommendationResponseDto>> GetPendingApprovalsForOwnerAsync(
        int currentUserId,
        string currentUserRole);
}
