using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Api.Entities.Tenancy;

// A Tenant is added ONLY by a verified Property Owner — there is no public
// self-registration endpoint for tenants.
//
// UserId stays null until the tenant completes the Activation PIN workflow
// (that workflow is a later module — not built yet). Until then, IsActive
// stays false and the tenant has no login.
public class Tenant
{
    public int Id { get; set; }

    // Nullable: no linked login account exists until PIN activation.
    public int? UserId { get; set; }

    public User? User { get; set; }

    public int PropertyId { get; set; }
    public SmartProperty.Api.Entities.Property.Property Property { get; set; } = null!;

    public int UnitId { get; set; }
    public SmartProperty.Api.Entities.Property.Unit Unit { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;

    // This is the number used later for PIN activation and login,
    // so it must be unique across all tenants (enforced in TenantConfiguration).
    public string MobileNumber { get; set; } = string.Empty;

    public string? Email { get; set; }

    // False until the tenant activates their account.
    public bool IsActive { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}