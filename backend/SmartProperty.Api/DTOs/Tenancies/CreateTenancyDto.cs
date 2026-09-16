using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Tenancies;

public class CreateTenancyDto
{
    [Required]
    public int TenantId { get; set; }

    [Required]
    public int UnitId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }
}