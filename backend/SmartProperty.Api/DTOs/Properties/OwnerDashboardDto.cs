namespace SmartProperty.Api.DTOs.Properties;

public class OwnerDashboardDto
{
    public int TotalProperties { get; set; }
    public int ActiveProperties { get; set; }
    public int ArchivedProperties { get; set; }
    public int TotalUnits { get; set; }
    public int ActiveUnits { get; set; }
    public int ArchivedUnits { get; set; }
}