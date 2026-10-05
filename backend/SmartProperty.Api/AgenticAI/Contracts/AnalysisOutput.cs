namespace SmartProperty.Api.AgenticAI.Contracts;

public class AnalysisOutput
{
    public string DetectedProblem { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Priority { get; set; } = string.Empty;

    public string RequiredSkill { get; set; } = string.Empty;

    public string Responsibility { get; set; } = string.Empty;

    public string? SafetyConcern { get; set; }

    public decimal Confidence { get; set; }

    public bool NeedsMoreInformation { get; set; }

    public string EmergencyClass { get; set; } = string.Empty;
}