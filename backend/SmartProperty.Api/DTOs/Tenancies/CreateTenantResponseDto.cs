namespace SmartProperty.Api.DTOs.Tenancies;

// Returned ONLY from POST /api/tenants — carries the ONE-TIME plaintext PIN.
// GET/PUT endpoints return the plain TenantResponseDto, which has no PIN field.
public class CreateTenantResponseDto : TenantResponseDto
{
    public string ActivationPin { get; set; } = string.Empty;
    public DateTime PinExpiresAt { get; set; }
}