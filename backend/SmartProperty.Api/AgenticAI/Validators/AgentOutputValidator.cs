using SmartProperty.Api.AgenticAI.Contracts;

namespace SmartProperty.Api.AgenticAI.Validators;

public class AgentOutputValidator
{
    private static readonly HashSet<string> AllowedResponsibilities =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "PROPERTY_RESPONSIBILITY",
            "TENANT_OWNED_ITEM",
            "POSSIBLE_TENANT_CAUSED_DAMAGE",
            "REQUIRES_OWNER_REVIEW"
        };

    private static readonly HashSet<string> AllowedEmergencyClasses =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "NORMAL_MAINTENANCE",
            "URGENT_MAINTENANCE",
            "LIFE_SAFETY_EMERGENCY"
        };

    public bool Validate(
        AnalysisOutput output,
        out List<string> errors)
    {
        errors = new List<string>();

        if (output == null)
        {
            errors.Add("Agent output is null.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(output.DetectedProblem))
            errors.Add("DetectedProblem is required.");

        if (string.IsNullOrWhiteSpace(output.Category))
            errors.Add("Category is required.");

        if (string.IsNullOrWhiteSpace(output.Priority))
            errors.Add("Priority is required.");

        if (!AllowedResponsibilities.Contains(output.Responsibility))
            errors.Add("Invalid responsibility value.");

        if (!AllowedEmergencyClasses.Contains(output.EmergencyClass))
            errors.Add("Invalid emergency class.");

        if (output.Confidence < 0 || output.Confidence > 1)
            errors.Add("Confidence must be between 0 and 1.");

        if (output.NeedsMoreInformation &&
            output.Confidence > 0.70m)
        {
            errors.Add(
                "NeedsMoreInformation cannot normally be true with high confidence.");
        }

        if (output.EmergencyClass == "LIFE_SAFETY_EMERGENCY" &&
            string.IsNullOrWhiteSpace(output.SafetyConcern))
        {
            errors.Add(
                "Life-safety emergencies must contain a safety warning.");
        }

        return errors.Count == 0;
    }
}