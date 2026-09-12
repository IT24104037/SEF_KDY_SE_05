using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Property;

public class PropertyOwner
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public OwnerVerificationStatus VerificationStatus { get; set; }
        = OwnerVerificationStatus.PendingVerification;

    public DateTime? VerifiedAt { get; set; }

    public int? VerifiedByAdminId { get; set; }

    public User? VerifiedByAdmin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OwnerVerificationDocument> VerificationDocuments { get; set; }
        = new List<OwnerVerificationDocument>();

    public ICollection<global::SmartProperty.Api.Entities.Property.Property> Properties { get; set; }
    = new List<global::SmartProperty.Api.Entities.Property.Property>();
}

public enum OwnerVerificationStatus
{
    PendingVerification,
    Verified,
    Rejected
}