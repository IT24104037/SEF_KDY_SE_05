using SmartProperty.Api.DTOs.AgenticAI;

namespace SmartProperty.Api.Interfaces;

public interface IAgentWorkflowService
{
    Task<WorkflowResponseDto> StartPlannerWorkflowAsync(int maintenanceRequestId, CancellationToken cancellationToken = default);

    Task<WorkflowResponseDto?> GetWorkflowByIdAsync(int workflowId, CancellationToken cancellationToken = default);

    Task<WorkflowResponseDto?> GetWorkflowByRequestIdAsync(int maintenanceRequestId, CancellationToken cancellationToken = default);

    Task<List<AgentExecutionLogDto>?> GetWorkflowLogsAsync(int workflowId, CancellationToken cancellationToken = default);
}
