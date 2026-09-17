namespace SmartProperty.Api.DTOs.Workers;

public class WorkerResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? Bio { get; set; }
    public decimal? HourlyRate { get; set; }
    public bool IsAvailable { get; set; }
    public List<string> Skills { get; set; } = new();
    public string ServiceArea { get; set; } = string.Empty;
    public string ProofDocumentName { get; set; } = string.Empty;
    public string ProofDocumentUrl { get; set; } = string.Empty;
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WorkerListResponseDto
{
    public List<WorkerResponseDto> Workers { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

