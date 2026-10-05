namespace SmartProperty.Api.AgenticAI.Contracts;

public class PlannerOutput
{
    public int MaintenanceRequestId { get; set; }

    public string Urgency { get; set; } = "Low";

    public string RequiredTrade { get; set; } = "General Maintenance";

    public string EstimatedDuration { get; set; } = "1-2 hours";

    public string Summary { get; set; } = string.Empty;

    public string RelevantContextSummary { get; set; } = string.Empty;

    public List<PlannerResolutionStep> ResolutionSteps { get; set; } = new List<PlannerResolutionStep>();

    public DateTime PlannedAt { get; set; } = DateTime.UtcNow;

    public bool IsSuccess { get; set; } = true;

    public string? ErrorMessage { get; set; }
}

public class PlannerResolutionStep
{
    public int StepNumber { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string RecommendedAction { get; set; } = string.Empty;
}
