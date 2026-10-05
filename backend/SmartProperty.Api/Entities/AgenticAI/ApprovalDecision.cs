using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Api.Entities.AgenticAI;

public class ApprovalDecision
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public int PropertyOwnerId { get; set; }

    public PropertyOwner PropertyOwner { get; set; } = null!;

    public string Decision { get; set; } = "Approved";

    public string? Notes { get; set; }

    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

