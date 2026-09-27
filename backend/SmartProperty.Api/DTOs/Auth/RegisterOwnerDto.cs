using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Auth;

public class RegisterOwnerDto
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required.")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile number must contain exactly 10 digits.")]
    public string Mobile { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    // Initial property details
    [Required]
    [StringLength(150)]
    public string PropertyName { get; set; } = string.Empty;

    [Required]
    public string PropertyAddress { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? PropertyDescription { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    // Ownership / management proof
    [Required]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    public string DocumentUrl { get; set; } = string.Empty;
}