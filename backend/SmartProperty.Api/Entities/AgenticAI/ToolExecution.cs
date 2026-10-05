namespace SmartProperty.Api.Entities.AgenticAI;

public class ToolExecution
{
    public int Id { get; set; }

    public int AgentWorkflowId { get; set; }

    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public int? WorkflowStepId { get; set; }

    public WorkflowStep? WorkflowStep { get; set; }

    public string ToolName { get; set; } = string.Empty;

    public ToolExecutionStatus Status { get; set; } = ToolExecutionStatus.Pending;

    public string? InputSummary { get; set; }

    public string? OutputSummary { get; set; }

    public string? ErrorSummary { get; set; }

    public int RetryCount { get; set; } = 0;

    public long? DurationMs { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

public enum ToolExecutionStatus
{
    Pending,
    Running,
    Completed,
    Failed
}
