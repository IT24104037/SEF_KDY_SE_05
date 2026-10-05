using SmartProperty.Api.Common;

namespace SmartProperty.Api.DTOs.Properties;

// Query parameters for GET /api/properties/{id}/units
// e.g. /api/properties/1/units?search=A-1&status=Occupied&sortBy=label&sortDirection=asc&page=1&pageSize=10
public class UnitQueryParameters : PaginationParameters
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string SortBy { get; set; } = "label";
    public string SortDirection { get; set; } = "asc";
}
