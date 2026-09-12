using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Property;

public class PropertyOwner
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<Property> Properties { get; set; } = new List<Property>();
}
