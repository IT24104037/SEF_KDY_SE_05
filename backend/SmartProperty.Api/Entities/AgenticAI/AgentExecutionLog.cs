namespace SmartProperty.Api.Entities.AgenticAI;

public class AgentExecutionLog
{
    public int Id { get; set; }

    public int AgentWorkflowId { get; set; }

    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public int? WorkflowStepId { get; set; }

    public WorkflowStep? WorkflowStep { get; set; }

    public string AgentName { get; set; } = string.Empty;

    public AgentExecutionStatus Status { get; set; } = AgentExecutionStatus.Running;

    public string Summary { get; set; } = string.Empty;

    public string? ErrorSummary { get; set; }

    public long? DurationMs { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}

public enum AgentExecutionStatus
{
    Running,
    Completed,
    Failed
}
