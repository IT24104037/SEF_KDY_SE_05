using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Admin;

public class RejectProfileChangeRequestDto
{
    [Required(ErrorMessage = "A rejection reason is required.")]
    public string RejectionReason { get; set; } = string.Empty;
}
