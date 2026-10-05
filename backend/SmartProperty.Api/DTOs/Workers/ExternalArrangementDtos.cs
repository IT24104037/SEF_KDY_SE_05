using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Workers;

public class CreateExternalArrangementDto
{
    [Required(ErrorMessage = "Provider name is required.")]
    public string ProviderName { get; set; } = string.Empty;

    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? EstimatedArrival { get; set; }
    public DateTime? ScheduledDateTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Note { get; set; }
}

public class UpdateExternalArrangementDto
{
    public string? ProviderName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? EstimatedArrival { get; set; }
    public DateTime? ScheduledDateTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Note { get; set; }
    public string? Status { get; set; } // "Scheduled", "Confirmed", "Completed", "Cancelled"
}

public class ConfirmExternalArrangementDto
{
    public string? EstimatedArrival { get; set; }
    public DateTime? ScheduledDateTime { get; set; }
    public string? Note { get; set; }
}

public class ExternalArrangementResponseDto
{
    public int Id { get; set; }
    public int MaintenanceRequestId { get; set; }
    public string RequestTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PropertyName { get; set; } = string.Empty;
    public string UnitLabel { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? EstimatedArrival { get; set; }
    public DateTime? ScheduledDateTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
