namespace SmartProperty.Api.DTOs.Properties;

public class PropertyResponseDto
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsArchived { get; set; }
}