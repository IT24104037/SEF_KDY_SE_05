namespace SmartProperty.Api.Entities.Worker;

public class ServiceArea
{
    public int Id { get; set; }

    public int WorkerId { get; set; }

    public Worker Worker { get; set; } = null!;

    public string City { get; set; } = string.Empty;

    public string? PostalCode { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public double RadiusKm { get; set; } = 25.0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

