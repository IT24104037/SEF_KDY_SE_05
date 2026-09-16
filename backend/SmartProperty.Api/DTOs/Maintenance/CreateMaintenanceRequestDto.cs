using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Maintenance;

public class CreateMaintenanceRequestDto
{
    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string RequestType { get; set; } = "NORMAL";

    [MaxLength(100)]
    public string? EmergencyType { get; set; }

    public string? ImageUrl { get; set; }
}