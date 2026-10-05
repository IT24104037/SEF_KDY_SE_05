using SmartProperty.Api.Entities.Maintenance;

namespace SmartProperty.Api.Entities.Worker;

public class WorkerSkill
{
    public int Id { get; set; }

    public int WorkerId { get; set; }

    public Worker Worker { get; set; } = null!;

    public string SkillName { get; set; } = string.Empty;

    public int? CategoryId { get; set; }

    public MaintenanceCategory? Category { get; set; }

    public int? YearsOfExperience { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

