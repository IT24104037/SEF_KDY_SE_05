namespace SmartProperty.Api.DTOs.Properties;

public class UnitOperationResult
{
    public UnitResponseDto? Unit { get; set; }
    public string? ErrorMessage { get; set; }

    public bool Success => Unit != null;
}