using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Properties;

public class UpdateUnitDto
{
    [Required]
    [StringLength(50)]
    public string UnitLabel { get; set; } = string.Empty;

    public string? Description { get; set; }
}