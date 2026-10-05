using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Owners;

public class CreateOwnerProfileChangeRequestDto
{
    [Required(ErrorMessage = "Full name is required.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required.")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile number must contain exactly 10 digits.")]
    public string Mobile { get; set; } = string.Empty;
}
