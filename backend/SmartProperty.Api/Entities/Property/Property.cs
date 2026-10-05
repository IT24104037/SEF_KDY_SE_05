using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Property;

public class Property
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public PropertyOwner? PropertyOwner { get; set; }

    public PropertyVerificationStatus VerificationStatus { get; set; }
        = PropertyVerificationStatus.UnderReview;

    public string? RejectionReason { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public int? VerifiedByAdminId { get; set; }

    public User? VerifiedByAdmin { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsArchived { get; set; }

    public ICollection<Unit> Units { get; set; } = new List<Unit>();

    public ICollection<PropertyVerificationDocument> VerificationDocuments { get; set; }
        = new List<PropertyVerificationDocument>();
}

public enum PropertyVerificationStatus
{
    UnderReview,
    Approved,
    Rejected
}
