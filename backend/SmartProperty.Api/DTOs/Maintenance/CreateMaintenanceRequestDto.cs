using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Maintenance;

public class CreateMaintenanceRequestDto
{
    [Required]
    public int PropertyId { get; set; }

    [Required]
    public int UnitId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    // NORMAL or EMERGENCY
    [Required]
    public string RequestType { get; set; } = "NORMAL";

    // Required only when RequestType = EMERGENCY
    public string? EmergencyType { get; set; }

    // Normal maintenance = required
    // Emergency = optional
    public string? ImageUrl { get; set; }
}