namespace SmartProperty.Api.DTOs.Maintenance;

public class TenantMaintenanceNotificationDto
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public string Decision { get; set; } = string.Empty;

    public string? OwnerMessage { get; set; }

    public DateTime DecidedAt { get; set; }

    public bool HasAssignedWorker { get; set; }

    public string? WorkerName { get; set; }

    public DateTime? ScheduledDateTime { get; set; }
}