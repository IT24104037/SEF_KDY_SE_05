using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Property;

public class PropertyOwner
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public OwnerVerificationStatus VerificationStatus { get; set; }
        = OwnerVerificationStatus.PendingVerification;

    public string? RejectionReason { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public int? VerifiedByAdminId { get; set; }

    public User? VerifiedByAdmin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OwnerVerificationDocument> VerificationDocuments { get; set; }
        = new List<OwnerVerificationDocument>();

    public ICollection<Property> Properties { get; set; } = new List<Property>();
}

public enum OwnerVerificationStatus
{
    PendingVerification,
    Verified,
    Rejected
}
