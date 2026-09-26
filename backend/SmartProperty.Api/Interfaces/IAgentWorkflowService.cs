using SmartProperty.Api.DTOs.AgenticAI;

namespace SmartProperty.Api.Interfaces;

public interface IAgentWorkflowService
{
    Task<WorkflowResponseDto> StartPlannerWorkflowAsync(int maintenanceRequestId, int currentUserId, string currentUserRole, CancellationToken cancellationToken = default);

    Task<WorkflowResponseDto?> GetWorkflowByIdAsync(int workflowId, int currentUserId, string currentUserRole, CancellationToken cancellationToken = default);

    Task<WorkflowResponseDto?> GetWorkflowByRequestIdAsync(int maintenanceRequestId, int currentUserId, string currentUserRole, CancellationToken cancellationToken = default);

    Task<List<AgentExecutionLogDto>?> GetWorkflowLogsAsync(int workflowId, int currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}
