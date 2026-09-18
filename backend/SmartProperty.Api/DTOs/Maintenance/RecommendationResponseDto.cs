namespace SmartProperty.Api.DTOs.Maintenance;

public class RecommendationResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Property { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public string Unit { get; set; } = string.Empty;
    public int UnitId { get; set; }
    public string Tenant { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RequestType { get; set; } = "NORMAL";
    public bool IsEmergency { get; set; }

    // Worker details
    public bool HasAvailableWorker { get; set; }
    public int? RecommendedWorkerId { get; set; }
    public string? RecommendedWorker { get; set; }
    public string? WorkerEmail { get; set; }
    public string? WorkerMobile { get; set; }
    public string? WorkerSkill { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? ServiceArea { get; set; }
    public DateTime? ProposedTime { get; set; }

    // Validation
    public string ValidationStatus { get; set; } = string.Empty;
    public string? ValidationSummary { get; set; }
    public string? Message { get; set; }
}

