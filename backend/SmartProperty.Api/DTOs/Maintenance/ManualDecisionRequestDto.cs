using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Maintenance;

public class ManualDecisionRequestDto
{
    [Required]
    public string Decision { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
}