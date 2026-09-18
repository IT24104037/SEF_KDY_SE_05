using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Workers;

public class AvailabilitySlotDto
{
    public int Id { get; set; }

    [Range(0, 6, ErrorMessage = "DayOfWeek must be between 0 (Sunday) and 6 (Saturday).")]
    public DayOfWeek DayOfWeek { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateAvailabilityDto
{
    [Required]
    public List<AvailabilitySlotDto> Slots { get; set; } = new();
}

public class AvailabilityResponseDto
{
    public List<AvailabilitySlotDto> Slots { get; set; } = new();
    public bool FreeNow { get; set; }
}

