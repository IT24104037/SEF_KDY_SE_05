namespace SmartProperty.Api.DTOs.Maintenance;

public class PagedMaintenanceRequestsDto
{
    public List<MaintenanceRequestDto> Requests { get; set; } = new();

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int TotalCount { get; set; }

    public int TotalPages { get; set; }
}