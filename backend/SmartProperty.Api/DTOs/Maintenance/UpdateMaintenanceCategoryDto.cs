using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Maintenance;

public class UpdateMaintenanceCategoryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; }
}