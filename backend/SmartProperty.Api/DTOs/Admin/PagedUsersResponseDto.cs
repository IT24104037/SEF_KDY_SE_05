namespace SmartProperty.Api.DTOs.Admin;

public class PagedUsersResponseDto
{
    public List<UserListItemDto> Users { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}