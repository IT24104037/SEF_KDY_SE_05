using SmartProperty.Api.Common;

namespace SmartProperty.Api.DTOs.Properties;

// Query parameters for GET /api/properties
// e.g. /api/properties?search=villa&city=Colombo&status=Approved&sortBy=name&sortDirection=asc&page=1&pageSize=10
public class PropertyQueryParameters : PaginationParameters
{
    public string? Search { get; set; }
    public string? City { get; set; }
    public string? Status { get; set; }
    public string SortBy { get; set; } = "name";
    public string SortDirection { get; set; } = "asc";
}
