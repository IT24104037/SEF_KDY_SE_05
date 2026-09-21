using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Auth;

public class OwnerReapplyRequestDto
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }

    public string? Mobile { get; set; }

    [Required]
    [StringLength(150)]
    public string PropertyName { get; set; } = string.Empty;

    [Required]
    public string PropertyAddress { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? PropertyDescription { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    [Required]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    public string DocumentUrl { get; set; } = string.Empty;
}