using SmartProperty.Api.Entities.Identity;

namespace SmartProperty.Api.Entities.Worker;

public class Worker
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public WorkerVerificationStatus VerificationStatus { get; set; }
        = WorkerVerificationStatus.PendingVerification;

    public DateTime? VerifiedAt { get; set; }

    public int? VerifiedByAdminId { get; set; }

    public User? VerifiedByAdmin { get; set; }

    public string? RejectionReason { get; set; }

    public string? Bio { get; set; }

    public decimal? HourlyRate { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkerSkill> Skills { get; set; }
        = new List<WorkerSkill>();

    public ICollection<WorkerDocument> Documents { get; set; }
        = new List<WorkerDocument>();

    public ICollection<WorkerAvailability> Availabilities { get; set; }
        = new List<WorkerAvailability>();

    public ICollection<ServiceArea> ServiceAreas { get; set; }
        = new List<ServiceArea>();

    public ICollection<WorkOrder> WorkOrders { get; set; }
        = new List<WorkOrder>();
}

public enum WorkerVerificationStatus
{
    PendingVerification,
    Verified,
    Rejected
}
