using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Tenancies;

public class UpdateTenantProfileDto
{
    [Required]
    [RegularExpression(
        @"^\d{10}$",
        ErrorMessage = "Phone number must contain exactly 10 digits.")]
    public string MobileNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string? Email { get; set; }
}