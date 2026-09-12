namespace SmartProperty.Api.Entities.Property;

public class OwnerVerificationDocument
{
    public int Id { get; set; }

    public int PropertyOwnerId { get; set; }

    public PropertyOwner? PropertyOwner { get; set; }

    public string DocumentType { get; set; } = string.Empty;

    public string DocumentUrl { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}