using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Tenancies;

public class ActivateTenantDto
{
    [Required(ErrorMessage = "Mobile number is required.")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile number must be exactly 10 digits.")]
    public string MobileNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "PIN is required.")]
    [MaxLength(6)]
    public string Pin { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}