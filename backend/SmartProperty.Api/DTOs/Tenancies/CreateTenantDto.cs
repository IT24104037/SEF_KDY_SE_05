using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Tenancies;

// What the Owner submits to add a Tenant. No UnitId here — Property/Unit
// isn't built yet, and unit assignment belongs to the Tenancy module anyway.
public class CreateTenantDto
{
    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required.")]
    [MaxLength(20)]
    [RegularExpression(@"^\d{7,15}$", ErrorMessage = "Mobile number must be 7-15 digits.")]
    public string MobileNumber { get; set; } = string.Empty;

    [MaxLength(150)]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string? Email { get; set; }

    [Range(1, int.MaxValue)]
    public int PropertyId { get; set; }

    [Range(1, int.MaxValue)]
    public int UnitId { get; set; }
}