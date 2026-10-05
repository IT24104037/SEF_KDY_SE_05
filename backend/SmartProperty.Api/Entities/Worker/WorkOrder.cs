using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.Entities.Worker;

public class WorkOrder
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public int WorkerId { get; set; }

    public Worker Worker { get; set; } = null!;

    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Assigned;

    public DateTime? ScheduledDate { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    public string? CompletionNotes { get; set; }

    public string? CompletionEvidenceUrl { get; set; }

    public bool IsEmergency { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum WorkOrderStatus
{
    Assigned,
    InProgress,
    Completed,
    Cancelled
}
