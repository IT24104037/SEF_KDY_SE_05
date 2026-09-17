using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Workers;

public class RegisterWorkerDto
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string Mobile { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(1, ErrorMessage = "Select at least one trade or skill.")]
    public List<string> Skills { get; set; } = new();

    [Required]
    [StringLength(200)]
    public string ServiceArea { get; set; } = string.Empty;

    [Required]
    public string ProofDocumentName { get; set; } = string.Empty;

    public string? ProofDocumentUrl { get; set; }
}

