namespace SmartProperty.Api.DTOs.Maintenance;

public class MaintenanceRequestDto
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    public int TenancyId { get; set; }

    public int PropertyId { get; set; }

    public string? PropertyName { get; set; }
    public string? PropertyAddress { get; set; }
    public string? UnitName { get; set; }   

    public int UnitId { get; set; }

    public string Description { get; set; } = string.Empty;

    public int? CategoryId { get; set; }

    public string? CategoryName { get; set; }

    public string RequestType { get; set; } = string.Empty;

    public string? EmergencyType { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Priority { get; set; }

    public List<string> ImageUrls { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}