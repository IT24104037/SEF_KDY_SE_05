namespace SmartProperty.Api.DTOs.Properties;

public class UnitResponseDto
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    public string UnitLabel { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsArchived { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string OccupancyStatus { get; set; } = "Vacant";

    public int? CurrentTenantId { get; set; }

    public string? CurrentTenantName { get; set; }

    public int? ActiveTenancyId { get; set; }
}