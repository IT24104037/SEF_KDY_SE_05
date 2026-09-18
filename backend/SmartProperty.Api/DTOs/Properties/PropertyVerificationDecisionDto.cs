using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Properties;

public class PropertyVerificationDecisionDto
{
    [Required]
    public string RejectionReason { get; set; } = string.Empty;
}
