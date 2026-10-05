
namespace SmartProperty.Api.Common;

// Shared base for any list endpoint's pagination. Any member can inherit
// this for their own query parameters (e.g. PropertyQueryParameters,
// WorkerQueryParameters) instead of redefining Page/PageSize each time.
public class PaginationParameters
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;

    public int Page { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 1 : value);
    }
}