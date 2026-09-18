using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;

namespace SmartProperty.Api.Entities.AgenticAI;

public class ValidationResult
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public int? WorkerId { get; set; }

    public Worker.Worker? Worker { get; set; }

    public ValidationStatus Status { get; set; } = ValidationStatus.Pass;

    public string Summary { get; set; } = string.Empty;

    public string? DetailsJson { get; set; }

    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ValidationStatus
{
    Pass,
    Fail,
    RevisionRequired
}

