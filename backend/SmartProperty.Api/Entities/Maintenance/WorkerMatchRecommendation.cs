using WorkerEntity = SmartProperty.Api.Entities.Worker.Worker;

namespace SmartProperty.Api.Entities.Maintenance;

public class WorkerMatchRecommendation
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public int? WorkerId { get; set; }

    public WorkerEntity? Worker { get; set; }

    public string Result { get; set; } = string.Empty;

    public string? RequiredSkill { get; set; }

    public int? CategoryId { get; set; }

    public MaintenanceCategory? Category { get; set; }

    public string? Priority { get; set; }

    public string? Safety { get; set; }

    public DateTime? SuggestedDateTime { get; set; }

    public int ActiveJobCount { get; set; }

    public int? YearsOfExperience { get; set; }

    public string? Reason { get; set; }

    public bool IsEmergency { get; set; }

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }
        = DateTime.UtcNow;
}