using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Maintenance;

public class UpdateMaintenanceRequestDto
{
    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public string? EmergencyType { get; set; }
}