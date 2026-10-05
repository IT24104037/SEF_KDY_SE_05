namespace SmartProperty.Api.AgenticAI.Contracts;

public class Agent3Input
{
    public int MaintenanceRequestId { get; set; }

    public int? CategoryId { get; set; }

    public string? RequiredSkill { get; set; }

    public string? Priority { get; set; }

    public string? Safety { get; set; }

    public bool IsEmergency { get; set; }

    public string? PropertyCity { get; set; }

    public string? PropertyPostalCode { get; set; }

    public double? PropertyLatitude { get; set; }

    public double? PropertyLongitude { get; set; }

    public DateTime? PreferredDateTime { get; set; }
}