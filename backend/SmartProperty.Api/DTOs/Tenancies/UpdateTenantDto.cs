using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Tenancies;

// Only the fields an Owner is allowed to edit after a Tenant is created.
// MobileNumber is intentionally excluded — it's the future activation/login
// identifier, so changing it should be a separate, carefully audited action
// if the team decides to support it at all.
public class UpdateTenantDto
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [MaxLength(150)]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string? Email { get; set; }
}