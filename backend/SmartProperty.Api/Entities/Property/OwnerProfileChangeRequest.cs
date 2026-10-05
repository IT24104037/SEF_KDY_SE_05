using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Property;

public class OwnerProfileChangeRequest
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public PropertyOwner? PropertyOwner { get; set; }

    public string RequestedFullName { get; set; } = string.Empty;

    public string? RequestedEmail { get; set; }

    public string? RequestedMobile { get; set; }

    public OwnerProfileChangeRequestStatus Status { get; set; } = OwnerProfileChangeRequestStatus.Pending;

    public string? RejectionReason { get; set; }

    public int? ReviewedByAdminId { get; set; }

    public User? ReviewedByAdmin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }
}

public enum OwnerProfileChangeRequestStatus
{
    Pending,
    Approved,
    Rejected
}
