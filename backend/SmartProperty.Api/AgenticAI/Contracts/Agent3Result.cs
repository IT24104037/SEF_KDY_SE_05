namespace SmartProperty.Api.AgenticAI.Contracts;

public class Agent3Result
{
    public int MaintenanceRequestId { get; set; }

    public string Result { get; set; } = string.Empty;

    public int? WorkerId { get; set; }

    public DateTime? SuggestedDateTime { get; set; }

    public int ActiveJobCount { get; set; }

    public int? YearsOfExperience { get; set; }

    public string? Reason { get; set; }

    public bool IsEmergency { get; set; }
}