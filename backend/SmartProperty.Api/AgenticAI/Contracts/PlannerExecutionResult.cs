using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.AgenticAI.Contracts;

public class ToolExecutionMetadata
{
    public string ToolName { get; set; } = string.Empty;

    public string InputSummary { get; set; } = string.Empty;

    public string? OutputSummary { get; set; }

    public string? ErrorSummary { get; set; }

    public ToolExecutionStatus Status { get; set; } = ToolExecutionStatus.Pending;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public long? DurationMs { get; set; }

    public int RetryCount { get; set; } = 0;
}

public class PlannerExecutionResult
{
    public PlannerOutput Output { get; set; } = new PlannerOutput();

    public List<ToolExecutionMetadata> ToolExecutions { get; set; } = new List<ToolExecutionMetadata>();
}
