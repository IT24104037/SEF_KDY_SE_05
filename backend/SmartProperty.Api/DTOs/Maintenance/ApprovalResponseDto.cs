namespace SmartProperty.Api.DTOs.Maintenance;

public class ApprovalResponseDto
{
    public bool Success { get; set; }
    public string Decision { get; set; } = string.Empty;
    public int? WorkOrderId { get; set; }
    public bool CreatedWorkOrder { get; set; }
    public string Message { get; set; } = string.Empty;
}

