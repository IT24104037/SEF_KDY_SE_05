using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Properties;

public class ResubmitPropertyDto
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public List<int> RemovedDocumentIds { get; set; } = new();

    public List<NewVerificationDocumentDto> NewDocuments { get; set; } = new();
}

public class NewVerificationDocumentDto
{
    [Required]
    [StringLength(100)]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string DocumentUrl { get; set; } = string.Empty;
}
