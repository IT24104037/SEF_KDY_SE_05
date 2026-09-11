using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Auth;

public class OwnerVerificationRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}