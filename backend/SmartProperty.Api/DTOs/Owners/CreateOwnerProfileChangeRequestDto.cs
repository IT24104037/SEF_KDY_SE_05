using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Owners;

public class CreateOwnerProfileChangeRequestDto
{
    [Required(ErrorMessage = "Full name is required.")]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string? Email { get; set; }

    public string? Mobile { get; set; }
}
