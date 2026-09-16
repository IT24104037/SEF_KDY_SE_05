namespace SmartProperty.Api.Entities.Tenancy;

public enum TenancyStatus
{
    Active,
    Ended
}

// One row = one stay of a Tenant in a Unit. A Unit can have MANY Tenancy
// rows over time (full history), but only ONE may be Status = Active at
// any moment — that rule is enforced in TenancyService, not here.
public class Tenancy
{
    public int Id { get; set; }

    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // TODO: once Member 1 builds Entities/Property/Unit.cs, turn this into
    // a real foreign key (add "public Unit? Unit { get; set; }" here and
    // configure HasOne/HasForeignKey in TenancyConfiguration). For now it's
    // just a plain int so Tenancy Management isn't blocked on Property/Unit.
    public int UnitId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; } // null while active

    public TenancyStatus Status { get; set; } = TenancyStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
