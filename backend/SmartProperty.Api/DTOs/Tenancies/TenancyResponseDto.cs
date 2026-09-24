using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.DTOs.Tenancies;

public class TenancyResponseDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string TenantFullName { get; set; } = string.Empty;
    public int UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TenancyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}