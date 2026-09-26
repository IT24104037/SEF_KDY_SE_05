namespace SmartProperty.Api.AgenticAI.Contracts;

public class AnalysisInput
{
    public int MaintenanceRequestId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? RequestType { get; set; }

    public string? EmergencyType { get; set; }

    public int PropertyId { get; set; }

    public int UnitId { get; set; }

    public List<string> ImageUrls { get; set; } = new();
}