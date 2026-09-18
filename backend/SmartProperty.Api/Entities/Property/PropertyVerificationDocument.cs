namespace SmartProperty.Api.Entities.Property;

public class PropertyVerificationDocument
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    public Property? Property { get; set; }

    public string DocumentType { get; set; } = string.Empty;

    public string DocumentUrl { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
