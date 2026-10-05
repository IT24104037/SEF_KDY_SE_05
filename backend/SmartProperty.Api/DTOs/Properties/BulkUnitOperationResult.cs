namespace SmartProperty.Api.DTOs.Properties;

public class BulkUnitOperationResult
{
    public List<UnitResponseDto> Units { get; set; } = new();
    public string? ErrorMessage { get; set; }

    public bool Success => Units.Count > 0;
}