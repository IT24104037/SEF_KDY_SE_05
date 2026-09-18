namespace SmartProperty.Api.Common;

// Shared wrapper for any paginated list response. Reusable by every
// member's module, not just Tenant Management.
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}