using SmartProperty.Api.AgenticAI.Contracts;

namespace SmartProperty.Api.DTOs.AgenticAI;

public class WorkflowResponseDto
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? CurrentStep { get; set; }

    public string? ApprovalStatus { get; set; }

    public string? FinalOutcome { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public PlannerOutput? PlannerOutput { get; set; }

    public List<WorkflowStepDto> Steps { get; set; } = new List<WorkflowStepDto>();

    public List<AgentExecutionLogDto> ExecutionLogs { get; set; } = new List<AgentExecutionLogDto>();
}

public class WorkflowStepDto
{
    public int Id { get; set; }

    public int StepOrder { get; set; }

    public string StepName { get; set; } = string.Empty;

    public string AgentName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? InputSummary { get; set; }

    public string? OutputSummary { get; set; }

    public string? ErrorSummary { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

public class AgentExecutionLogDto
{
    public int Id { get; set; }

    public string AgentName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string? ErrorSummary { get; set; }

    public long? DurationMs { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}
