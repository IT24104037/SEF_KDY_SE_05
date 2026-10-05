using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Properties;

public class CreatePropertyDto
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }
}