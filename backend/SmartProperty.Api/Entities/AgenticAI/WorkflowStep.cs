namespace SmartProperty.Api.Entities.AgenticAI;

public class WorkflowStep
{
    public int Id { get; set; }

    public int AgentWorkflowId { get; set; }

    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public int StepOrder { get; set; }

    public string StepName { get; set; } = string.Empty;

    public string AgentName { get; set; } = string.Empty;

    public WorkflowStepStatus Status { get; set; } = WorkflowStepStatus.Pending;

    public string? InputSummary { get; set; }

    public string? OutputSummary { get; set; }

    public string? ErrorSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ICollection<ToolExecution> ToolExecutions { get; set; } = new List<ToolExecution>();

    public ICollection<AgentExecutionLog> ExecutionLogs { get; set; } = new List<AgentExecutionLog>();
}

public enum WorkflowStepStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Skipped
}
