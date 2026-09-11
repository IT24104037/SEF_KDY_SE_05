namespace SmartProperty.Api.Entities.Property;

public class Property
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public PropertyOwner? PropertyOwner { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsArchived { get; set; }

    public ICollection<Unit> Units { get; set; } = new List<Unit>();
}