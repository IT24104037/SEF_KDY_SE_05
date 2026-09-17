namespace SmartProperty.Api.DTOs.Maintenance;

public class ApprovalRequestDto
{
    public string Decision { get; set; } = "Approve"; // "Approve", "Reject", "RevisionRequested"
    public int? WorkerId { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public string? Notes { get; set; }
}
