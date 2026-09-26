using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Tools;

namespace SmartProperty.Api.AgenticAI.Agents;

public class PlannerCoordinatorAgent
{
    private readonly MaintenanceContextTool _maintenanceContextTool;
    private readonly PropertyContextTool _propertyContextTool;

    public PlannerCoordinatorAgent(
        MaintenanceContextTool maintenanceContextTool,
        PropertyContextTool propertyContextTool)
    {
        _maintenanceContextTool = maintenanceContextTool;
        _propertyContextTool = propertyContextTool;
    }

    public async Task<PlannerOutput> CreatePlanAsync(int maintenanceRequestId, CancellationToken cancellationToken = default)
    {
        // 1. Gather Maintenance Context
        var maintContext = await _maintenanceContextTool.GetMaintenanceContextAsync(maintenanceRequestId, cancellationToken);
        if (!maintContext.Exists)
        {
            return new PlannerOutput
            {
                MaintenanceRequestId = maintenanceRequestId,
                IsSuccess = false,
                ErrorMessage = maintContext.ErrorMessage ?? $"Maintenance request {maintenanceRequestId} not found."
            };
        }

        // 2. Gather Property Context
        var propContext = await _propertyContextTool.GetPropertyContextForRequestAsync(maintenanceRequestId, cancellationToken);

       // Agent 1 coordinates only.
    // Agent 2 is responsible for urgency, category and required skill.
        string urgency = "Pending Agent 2 Analysis";
        string requiredTrade = "Pending Agent 2 Analysis";
        string estimatedDuration = "Pending Agent 2 Analysis";

        // 6. Build Context Summary
        string contextSummary = BuildContextSummary(maintContext, propContext);

        // 7. Generate Structured Resolution Steps
        var steps = GenerateResolutionSteps();

        // 8. Construct Output
        return new PlannerOutput
        {
            MaintenanceRequestId = maintenanceRequestId,
            Urgency = urgency,
            RequiredTrade = requiredTrade,
            EstimatedDuration = estimatedDuration,
            Summary =
                    $"Planning coordination completed for request #{maintenanceRequestId}. " +
                    "Maintenance analysis has been assigned to Agent 2.",
            RelevantContextSummary = contextSummary,
            ResolutionSteps = steps,
            PlannedAt = DateTime.UtcNow,
            IsSuccess = true
        };
    }

    private static string DetermineUrgency(string requestType, string? priority, string? emergencyType)
    {
        if (string.Equals(requestType, "EMERGENCY", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(emergencyType))
        {
            return "Emergency";
        }

        if (string.Equals(priority, "High", StringComparison.OrdinalIgnoreCase))
        {
            return "High";
        }

        if (string.Equals(priority, "Medium", StringComparison.OrdinalIgnoreCase))
        {
            return "Medium";
        }

        return "Low";
    }

    private static string DetermineRequiredTrade(string? categoryName, string description)
    {
        if (!string.IsNullOrWhiteSpace(categoryName))
        {
            var cat = categoryName.ToLowerInvariant();
            if (cat.Contains("plumb")) return "Plumbing";
            if (cat.Contains("electr")) return "Electrical";
            if (cat.Contains("hvac") || cat.Contains("heat") || cat.Contains("air")) return "HVAC";
            if (cat.Contains("carpent") || cat.Contains("wood") || cat.Contains("door") || cat.Contains("window")) return "Carpentry";
            if (cat.Contains("roof") || cat.Contains("leak")) return "Roofing";
            if (cat.Contains("appliance")) return "Appliance Repair";
            if (cat.Contains("pest")) return "Pest Control";
            if (cat.Contains("paint")) return "Painting";
        }

        var desc = description.ToLowerInvariant();
        if (desc.Contains("leak") || desc.Contains("pipe") || desc.Contains("sink") || desc.Contains("toilet") || desc.Contains("water") || desc.Contains("drain"))
            return "Plumbing";

        if (desc.Contains("power") || desc.Contains("spark") || desc.Contains("wire") || desc.Contains("socket") || desc.Contains("switch") || desc.Contains("light"))
            return "Electrical";

        if (desc.Contains("ac ") || desc.Contains("air condition") || desc.Contains("heater") || desc.Contains("hvac") || desc.Contains("cooling"))
            return "HVAC";

        if (desc.Contains("lock") || desc.Contains("door") || desc.Contains("cabinet") || desc.Contains("window"))
            return "Carpentry";

        return "General Maintenance";
    }

    private static string EstimateDuration(string urgency, string requiredTrade)
    {
        if (urgency == "Emergency") return "1-2 Hours (Immediate Response)";
        if (requiredTrade == "Plumbing" || requiredTrade == "Electrical" || requiredTrade == "HVAC") return "2-4 Hours";
        return "1-3 Hours";
    }

    private static string BuildContextSummary(MaintenanceContextResult maint, PropertyContextResult prop)
    {
        var categoryText = !string.IsNullOrWhiteSpace(maint.CategoryName) ? maint.CategoryName : "Uncategorized";
        var propertyText = prop.Exists ? $"{prop.PropertyName} (Unit {prop.UnitLabel}, {prop.PropertyAddress})" : "Property Details Unavailable";
        var imagesText = maint.ImageUrls.Count > 0 ? $"{maint.ImageUrls.Count} attached image(s)" : "No images attached";

        return $"Property: {propertyText}. Request Category: {categoryText}. Images: {imagesText}. Request Status: {maint.Status}.";
    }

    private static List<PlannerResolutionStep> GenerateResolutionSteps()
        {
            return new List<PlannerResolutionStep>
            {
                new PlannerResolutionStep
                {
                    StepNumber = 1,
                    Title = "Gather Maintenance Context",
                    Description =
                        "Validate the maintenance request, property, unit and available evidence.",
                    RecommendedAction =
                        "Prepare the maintenance context for downstream agent processing."
                },

                new PlannerResolutionStep
                {
                    StepNumber = 2,
                    Title = "Maintenance Analysis & Responsibility",
                    Description =
                        "Agent 2 analyses the maintenance description, request context, safety, responsibility and required skill.",
                    RecommendedAction =
                        "Pass the validated maintenance request to Agent 2."
                },

                new PlannerResolutionStep
                {
                    StepNumber = 3,
                    Title = "Technician Matching & Scheduling",
                    Description =
                        "Agent 3 uses Agent 2's analysis to identify a suitable verified worker and time.",
                    RecommendedAction =
                        "Pass the structured Agent 2 result to Agent 3."
                },

                new PlannerResolutionStep
                {
                    StepNumber = 4,
                    Title = "Validation & Approval Preparation",
                    Description =
                        "Agent 4 validates the recommendation, safety and business rules before human approval.",
                    RecommendedAction =
                        "Prepare the validated recommendation for Property Owner approval."
                }
            };
        }
}
