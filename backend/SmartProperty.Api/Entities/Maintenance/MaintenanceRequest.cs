using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Entities.Maintenance;

public class MaintenanceRequest
{
    public int Id { get; set; }

    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    // Tenancy entity has not been created by Member 2 yet.\

    public int TenancyId { get; set; }

    public SmartProperty.Api.Entities.Tenancy.Tenancy Tenancy { get; set; } = null!;
    // We will connect this properly later.
    public int PropertyId { get; set; }
    public SmartProperty.Api.Entities.Property.Property Property { get; set; } = null!;

    public int UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public int? CategoryId { get; set; }
    public MaintenanceCategory? Category { get; set; }

    public string RequestType { get; set; } = "NORMAL";

    public string? EmergencyType { get; set; }

    public string Status { get; set; } = "Submitted";

    public string? Priority { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsArchived { get; set; } = false;

    public DateTime? ArchivedAt { get; set; }

    public int? ArchivedByUserId { get; set; }
}