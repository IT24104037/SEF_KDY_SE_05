namespace SmartProperty.Api.DTOs.Properties;

public class RestoreUnitOperationResult
{
    public bool Success { get; set; }

    public bool DuplicateLabel { get; set; }

    public string? ErrorMessage { get; set; }
}