namespace SmartProperty.Api.DTOs.Tenancies;

public class EndTenancyDto
{
    // If not provided, the service defaults this to today's date.
    public DateTime? EndDate { get; set; }
}