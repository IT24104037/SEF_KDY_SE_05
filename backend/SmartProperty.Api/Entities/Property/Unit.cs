namespace SmartProperty.Api.Entities.Property;

public class Unit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public ICollection<SmartProperty.Api.Entities.Tenancy.Tenant> Tenants { get; set; } = new List<SmartProperty.Api.Entities.Tenancy.Tenant>();
}
