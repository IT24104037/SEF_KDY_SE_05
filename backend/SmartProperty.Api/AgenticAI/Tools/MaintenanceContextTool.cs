using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;

namespace SmartProperty.Api.AgenticAI.Tools;

public class MaintenanceContextResult
{
    public int MaintenanceRequestId { get; set; }

    public string Description { get; set; } = string.Empty;

    public int? CategoryId { get; set; }

    public string? CategoryName { get; set; }

    public string RequestType { get; set; } = "NORMAL";

    public string? EmergencyType { get; set; }

    public string Status { get; set; } = "Submitted";

    public string? Priority { get; set; }

    public List<string> ImageUrls { get; set; } = new List<string>();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool Exists { get; set; }

    public string? ErrorMessage { get; set; }
}

public class MaintenanceContextTool
{
    private readonly AppDbContext _dbContext;

    public MaintenanceContextTool(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MaintenanceContextResult> GetMaintenanceContextAsync(int maintenanceRequestId, CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId, cancellationToken);

        if (request == null)
        {
            return new MaintenanceContextResult
            {
                MaintenanceRequestId = maintenanceRequestId,
                Exists = false,
                ErrorMessage = $"Maintenance request with ID {maintenanceRequestId} was not found."
            };
        }

        var images = await _dbContext.MaintenanceImages
            .AsNoTracking()
            .Where(img => img.MaintenanceRequestId == maintenanceRequestId)
            .Select(img => img.ImageUrl)
            .ToListAsync(cancellationToken);

        return new MaintenanceContextResult
        {
            MaintenanceRequestId = request.Id,
            Description = request.Description,
            CategoryId = request.CategoryId,
            CategoryName = request.Category?.Name,
            RequestType = request.RequestType,
            EmergencyType = request.EmergencyType,
            Status = request.Status,
            Priority = request.Priority,
            ImageUrls = images,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            Exists = true
        };
    }
}
