namespace SmartProperty.Api.DTOs.Owners;

public class OwnerProfileChangeRequestResponseDto
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public string RequestedFullName { get; set; } = string.Empty;

    public string? RequestedEmail { get; set; }

    public string? RequestedMobile { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }
}
