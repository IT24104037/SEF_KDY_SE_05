namespace SmartProperty.Api.Entities.Worker;

public class WorkerDocument
{
    public int Id { get; set; }

    public int WorkerId { get; set; }

    public Worker Worker { get; set; } = null!;

    public string DocumentType { get; set; } = string.Empty;

    public string DocumentUrl { get; set; } = string.Empty;

    public string? OriginalFileName { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

