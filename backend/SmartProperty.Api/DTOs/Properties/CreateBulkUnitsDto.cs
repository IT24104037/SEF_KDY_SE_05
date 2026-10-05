using System.ComponentModel.DataAnnotations;

namespace SmartProperty.Api.DTOs.Properties;

public class CreateBulkUnitsDto
{
    [Required]
    [MinLength(1)]
    public List<CreateUnitDto> Units { get; set; } = new();
}