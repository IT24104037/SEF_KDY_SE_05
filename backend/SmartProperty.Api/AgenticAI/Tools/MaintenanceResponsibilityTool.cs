
namespace SmartProperty.Api.AgenticAI.Tools;

public class ResponsibilityAnalysisResult
{
    public string Responsibility { get; set; } = "REQUIRES_OWNER_REVIEW";

    public string Reason { get; set; } = string.Empty;

    public bool RequiresOwnerReview { get; set; }

    public decimal Confidence { get; set; }
}

public class MaintenanceResponsibilityTool
{
    public ResponsibilityAnalysisResult Analyze(
        string description,
        string category,
        bool hasImages)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return new ResponsibilityAnalysisResult
            {
                Responsibility = "REQUIRES_OWNER_REVIEW",
                Reason = "Maintenance description is missing.",
                RequiresOwnerReview = true,
                Confidence = 0.10m
            };
        }

        var text = description.ToLowerInvariant();

        // Tenant-owned appliances
        if (ContainsAny(
            text,
            "my microwave",
            "my refrigerator",
            "my fridge",
            "my washing machine",
            "my television",
            "my personal appliance"))
        {
            return new ResponsibilityAnalysisResult
            {
                Responsibility = "TENANT_OWNED_ITEM",
                Reason = "The description indicates that the affected item may belong to the tenant.",
                RequiresOwnerReview = false,
                Confidence = 0.90m
            };
        }

        // Possible tenant-caused damage
        if (ContainsAny(
            text,
            "i broke",
            "i damaged",
            "accidentally broke",
            "accidentally damaged",
            "my fault"))
        {
            return new ResponsibilityAnalysisResult
            {
                Responsibility = "POSSIBLE_TENANT_CAUSED_DAMAGE",
                Reason = "The tenant description indicates possible tenant-caused damage.",
                RequiresOwnerReview = true,
                Confidence = 0.85m
            };
        }

        // Property infrastructure
        if (ContainsAny(
            text,
            "pipe",
            "ceiling",
            "wall",
            "roof",
            "water leak",
            "water leakage",
            "plumbing",
            "electrical",
            "power failure",
            "socket",
            "switch"))
        {
            return new ResponsibilityAnalysisResult
            {
                Responsibility = "PROPERTY_RESPONSIBILITY",
                Reason = "The issue appears related to property infrastructure.",
                RequiresOwnerReview = false,
                Confidence = 0.85m
            };
        }

        // If an image exists but text is insufficient,
        // do not pretend the image was visually understood.
        if (hasImages)
        {
            return new ResponsibilityAnalysisResult
            {
                Responsibility = "REQUIRES_OWNER_REVIEW",
                Reason = "An image is attached, but this system does not use an external vision model. Manual review is required.",
                RequiresOwnerReview = true,
                Confidence = 0.30m
            };
        }

        return new ResponsibilityAnalysisResult
        {
            Responsibility = "REQUIRES_OWNER_REVIEW",
            Reason = "Available information is insufficient to determine responsibility safely.",
            RequiresOwnerReview = true,
            Confidence = 0.20m
        };
    }

    private static bool ContainsAny(
        string text,
        params string[] keywords)
    {
        return keywords.Any(
            keyword => text.Contains(
                keyword,
                StringComparison.OrdinalIgnoreCase));
    }
}