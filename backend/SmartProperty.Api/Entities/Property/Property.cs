namespace SmartProperty.Api.Entities.Property;

public class Property
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PropertyOwnerId { get; set; }
    public PropertyOwner PropertyOwner { get; set; } = null!;
    public ICollection<Unit> Units { get; set; } = new List<Unit>();
}
