using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Workers;

public class VerifyWorkerDto
{
    [Required]
    public string Decision { get; set; } = string.Empty; // "Verified" or "Rejected"

    public string? RejectionReason { get; set; }
}

