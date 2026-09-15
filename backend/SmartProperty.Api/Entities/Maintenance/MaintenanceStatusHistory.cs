using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Maintenance;


public class MaintenanceStatusHistory
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public string OldStatus { get; set; } = string.Empty;

    public string NewStatus { get; set; } = string.Empty;

    // User who changed the status, if available
    public int? ChangedByUserId { get; set; }
    
    public User? ChangedByUser { get; set; }

    public string? Note { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    
}