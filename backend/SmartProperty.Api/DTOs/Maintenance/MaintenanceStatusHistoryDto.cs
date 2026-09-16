namespace SmartProperty.Api.DTOs.Maintenance;

public class MaintenanceStatusHistoryDto
{
    public int Id { get; set; }

    public string OldStatus { get; set; } = string.Empty;

    public string NewStatus { get; set; } = string.Empty;

    public int? ChangedByUserId { get; set; }

    public string? Note { get; set; }

    public DateTime ChangedAt { get; set; }
}