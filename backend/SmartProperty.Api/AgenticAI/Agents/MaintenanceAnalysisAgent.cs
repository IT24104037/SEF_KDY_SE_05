using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Tools;

using SmartProperty.Api.AgenticAI.Agents;

namespace SmartProperty.Api.AgenticAI.Agents;

public class MaintenanceAnalysisAgent
{
     private readonly MaintenanceResponsibilityTool _responsibilityTool;
 
    public MaintenanceAnalysisAgent(
        MaintenanceResponsibilityTool responsibilityTool)
    {
        _responsibilityTool = responsibilityTool;
    }

    public async Task<AnalysisOutput> AnalyzeAsync(
        AnalysisInput input,
        CancellationToken cancellationToken = default)
    {
       
        cancellationToken.ThrowIfCancellationRequested();

        if (input == null)
        {
            throw new ArgumentNullException(nameof(input));
        }

        if (string.IsNullOrWhiteSpace(input.Description))
        {
            return CreateNeedsInformationResult(
                "Maintenance description is missing.");
        }

        if (ContainsUnsafeInstruction(input.Description))
        {
            return CreateNeedsInformationResult(
                "The maintenance description contains unsupported instructions.");
        }

        string description = input.Description.ToLowerInvariant();

        bool isEmergencyRequest =
            string.Equals(
                input.RequestType,
                "EMERGENCY",
                StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrWhiteSpace(input.EmergencyType);

        string emergencyText =
            $"{input.EmergencyType ?? string.Empty} {description}"
                .ToLowerInvariant();


        if (ContainsAny(emergencyText,
            "fire",
            "smoke",
            "gas leak",
            "gas leakage",
            "sparking",
            "electric shock",
            "exposed wire",
            "electrical fire"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Potential life-safety hazard",
                Category = "SAFETY",
                Priority = "CRITICAL",
                RequiredSkill = "Electrical",
                Responsibility = "PROPERTY_RESPONSIBILITY",
                SafetyConcern =
                    "Move away from the affected area and avoid touching exposed electrical or hazardous components. Contact emergency services if there is immediate danger.",
                Confidence = 0.95m,
                NeedsMoreInformation = false,
                EmergencyClass = "LIFE_SAFETY_EMERGENCY"
            };
        }

        if (ContainsAny(description,
            "heavy leak",
            "water leaking",
            "water leakage",
            "flooding",
            "burst pipe",
            "major leak"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Significant water leakage",
                Category = "PLUMBING",
                Priority = "HIGH",
                RequiredSkill = "Plumbing",
                Responsibility = GetResponsibility(
                        input,
                        "PLUMBING"),
                SafetyConcern = "Keep electrical equipment away from the affected area.",
                Confidence = 0.93m,
                NeedsMoreInformation = false,
                EmergencyClass = "URGENT_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
            "light not working",
            "switch not working",
            "socket not working",
            "power failure",
            "electricity problem"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Electrical system problem",
                Category = "ELECTRICAL",
                Priority = "MEDIUM",
                RequiredSkill = "Electrical",
                Responsibility = GetResponsibility(
                        input,
                        "ELECTRICAL"),
                SafetyConcern = "Do not attempt electrical repairs without appropriate expertise.",
                Confidence = 0.88m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
            "tap",
            "faucet",
            "sink",
            "toilet",
            "pipe",
            "drain",
            "water"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Plumbing problem",
                Category = "PLUMBING",
                Priority = "MEDIUM",
                RequiredSkill = "Plumbing",
              Responsibility = GetResponsibility(
                        input,
                        "PLUMBING"),
                Confidence = 0.86m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
            "wall crack",
            "ceiling crack",
            "broken door",
            "broken window",
            "damaged wall",
            "roof damage"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Possible structural/property damage",
                Category = "STRUCTURAL",
                Priority = "MEDIUM",
                RequiredSkill = "PROPERTY_MAINTENANCE",
                Responsibility = GetResponsibility(
                        input,
                        "STRUCTURAL"),
                Confidence = 0.82m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
            "my microwave",
            "my refrigerator",
            "my fridge",
            "my washing machine",
            "my television",
            "my personal appliance"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Possible tenant-owned appliance problem",
                Category = "APPLIANCE",
                Priority = "LOW",
                RequiredSkill = "APPLIANCE_TECHNICIAN",
                Responsibility = GetResponsibility(
                        input,
                        "APPLIANCE"),
                Confidence = 0.89m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
            "i broke",
            "i damaged",
            "accidentally broke",
            "accidentally damaged",
            "my fault"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Possible tenant-caused damage",
                Category = "DAMAGE",
                Priority = "MEDIUM",
                RequiredSkill = "PROPERTY_MAINTENANCE",
                Responsibility = GetResponsibility(
                        input,
                        "DAMAGE"),
                Confidence = 0.84m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }



    if (isEmergencyRequest)
{
    return new AnalysisOutput
    {
        DetectedProblem =
            "Emergency request requires further safety review",
        Category = "UNKNOWN",
        Priority = "CRITICAL",
        RequiredSkill = "UNKNOWN",
        Responsibility = "REQUIRES_OWNER_REVIEW",
        SafetyConcern =
            "Treat the issue as urgent until the emergency type and site conditions are confirmed.",
        Confidence = 0.40m,
        NeedsMoreInformation = true,
        EmergencyClass = "URGENT_MAINTENANCE"
    };
}
       return CreateNeedsInformationResult(
            "The available information is insufficient to classify the maintenance issue safely.");
    }

        private string GetResponsibility(
        AnalysisInput input,
        string category)
    {
        var result = _responsibilityTool.Analyze(
            input.Description,
            category,
            input.ImageUrls?.Count > 0);

        return result.Responsibility;
    }

    private static AnalysisOutput CreateNeedsInformationResult(string reason)
    {
        return new AnalysisOutput
        {
            DetectedProblem = reason,
            Category = "UNKNOWN",
            Priority = "REVIEW",
            RequiredSkill = "UNKNOWN",
            Responsibility = "REQUIRES_OWNER_REVIEW",
            Confidence = 0.20m,
            NeedsMoreInformation = true,
            EmergencyClass = "NORMAL_MAINTENANCE"
        };
    }

    private static bool ContainsAny(string text, params string[] keywords)
    {
        return keywords.Any(text.Contains);
    }

    private static bool ContainsUnsafeInstruction(string text)
    {
        string[] unsafePatterns =
        {
            "ignore previous instructions",
            "ignore all previous instructions",
            "system prompt",
            "developer message",
            "reveal your prompt",
            "bypass security",
            "disable validation"
        };

        return unsafePatterns.Any(
            pattern => text.Contains(pattern, StringComparison.OrdinalIgnoreCase));
    }
}