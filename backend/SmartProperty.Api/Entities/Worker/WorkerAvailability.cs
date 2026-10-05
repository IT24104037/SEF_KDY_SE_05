namespace SmartProperty.Api.Entities.Worker;

public class WorkerAvailability
{
    public int Id { get; set; }

    public int WorkerId { get; set; }

    public Worker Worker { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

