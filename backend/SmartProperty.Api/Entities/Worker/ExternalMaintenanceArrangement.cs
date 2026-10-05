using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.Entities.Worker;

public class ExternalMaintenanceArrangement
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public string ProviderName { get; set; } = string.Empty;

    public string? ContactPhone { get; set; }

    public string? ContactEmail { get; set; }

    public DateTime? ScheduledDateTime { get; set; }

    public string? EstimatedArrival { get; set; }

    public decimal? EstimatedCost { get; set; }

    public string? Note { get; set; }

    public bool IsEmergency { get; set; } = false;

    public string Status { get; set; } = "Scheduled";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

