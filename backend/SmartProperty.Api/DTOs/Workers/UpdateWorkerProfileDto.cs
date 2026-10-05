using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Workers;

public class UpdateWorkerProfileDto
{
    [StringLength(1000)]
    public string? Bio { get; set; }

    [Range(0, 100000, ErrorMessage = "Hourly rate must be a valid positive value.")]
    public decimal? HourlyRate { get; set; }

    public bool IsAvailable { get; set; } = true;

    [StringLength(200)]
    public string? ServiceArea { get; set; }

    public List<string>? Skills { get; set; }
}

