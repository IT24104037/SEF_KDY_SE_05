using SmartProperty.Api.Common;

namespace SmartProperty.Api.DTOs.Tenancies;

// Query string parameters for GET /api/tenants
// e.g. /api/tenants?search=john&isActive=true&sortBy=FullName&page=2
public class TenantQueryParameters : PaginationParameters
{
    public string? Search { get; set; }        // matches FullName, MobileNumber, Email
    public bool? IsActive { get; set; }         // filter by activation status
    public int? PropertyId { get; set; }
    public int? UnitId { get; set; }
    public string SortBy { get; set; } = "CreatedAt"; // "FullName" | "CreatedAt"
    public bool Descending { get; set; } = true;
}