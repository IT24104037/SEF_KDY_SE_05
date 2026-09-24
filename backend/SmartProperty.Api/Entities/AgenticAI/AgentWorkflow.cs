using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.Entities.AgenticAI;

public class AgentWorkflow
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public AgentWorkflowStatus Status { get; set; } = AgentWorkflowStatus.Pending;

    public string? CurrentStep { get; set; }

    public string? ApprovalStatus { get; set; }

    public string? FinalOutcome { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkflowStep> WorkflowSteps { get; set; } = new List<WorkflowStep>();

    public ICollection<ToolExecution> ToolExecutions { get; set; } = new List<ToolExecution>();

    public ICollection<AgentExecutionLog> ExecutionLogs { get; set; } = new List<AgentExecutionLog>();
}

public enum AgentWorkflowStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled
}
