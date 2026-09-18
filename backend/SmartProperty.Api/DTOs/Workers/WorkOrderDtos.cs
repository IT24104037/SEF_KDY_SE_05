namespace SmartProperty.Api.DTOs.Workers;

public class WorkOrderResponseDto
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
    public int WorkerId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public string? WorkerEmail { get; set; }
    public string? WorkerMobile { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ScheduledDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public string? CompletionNotes { get; set; }
    public string? CompletionEvidenceUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateWorkOrderStatusDto
{
    public string Status { get; set; } = string.Empty; // "InProgress", "Completed", "Cancelled"
    public string? Notes { get; set; }
    public string? CompletionNotes { get; set; }
    public string? CompletionEvidenceUrl { get; set; }
}

public class WorkOrderListResponseDto
{
    public List<WorkOrderResponseDto> WorkOrders { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}
