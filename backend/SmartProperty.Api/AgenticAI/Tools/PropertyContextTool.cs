using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;

namespace SmartProperty.Api.AgenticAI.Tools;

public class PropertyContextResult
{
    public int PropertyId { get; set; }

    public string PropertyName { get; set; } = string.Empty;

    public string PropertyAddress { get; set; } = string.Empty;

    public string? City { get; set; }

    public int UnitId { get; set; }

    public string UnitLabel { get; set; } = string.Empty;

    public string? UnitDescription { get; set; }

    public int TenancyId { get; set; }

    public string? TenancyStatus { get; set; }

    public int TenantId { get; set; }

    public bool Exists { get; set; }

    public string? ErrorMessage { get; set; }
}

public class PropertyContextTool
{
    private readonly AppDbContext _dbContext;

    public PropertyContextTool(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PropertyContextResult> GetPropertyContextForRequestAsync(int maintenanceRequestId, CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Property)
            .Include(r => r.Unit)
            .Include(r => r.Tenancy)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId, cancellationToken);

        if (request == null || request.Property == null || request.Unit == null)
        {
            return new PropertyContextResult
            {
                Exists = false,
                ErrorMessage = $"Property context for maintenance request ID {maintenanceRequestId} could not be retrieved."
            };
        }

        return new PropertyContextResult
        {
            PropertyId = request.PropertyId,
            PropertyName = request.Property.Name,
            PropertyAddress = request.Property.Address,
            City = request.Property.City,
            UnitId = request.UnitId,
            UnitLabel = request.Unit.UnitLabel,
            UnitDescription = request.Unit.Description,
            TenancyId = request.TenancyId,
            TenancyStatus = request.Tenancy?.Status.ToString(),
            TenantId = request.TenantId,
            Exists = true
        };
    }
}
