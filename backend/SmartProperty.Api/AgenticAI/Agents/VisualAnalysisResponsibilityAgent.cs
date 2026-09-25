using SmartProperty.Api.AgenticAI.Contracts;

namespace SmartProperty.Api.AgenticAI.Agents;

public class VisualAnalysisResponsibilityAgent.cs
{
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

        if (ContainsAny(description,
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
                RequiredSkill = "ELECTRICIAN",
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
                RequiredSkill = "PLUMBER",
                Responsibility = DetermineResponsibility(description),
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
                RequiredSkill = "ELECTRICIAN",
                Responsibility = "PROPERTY_RESPONSIBILITY",
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
                RequiredSkill = "PLUMBER",
                Responsibility = DetermineResponsibility(description),
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
                Responsibility = DetermineResponsibility(description),
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
                Responsibility = "TENANT_OWNED_ITEM",
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
                Responsibility = "POSSIBLE_TENANT_CAUSED_DAMAGE",
                Confidence = 0.84m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        return CreateNeedsInformationResult(
            "The available information is insufficient to classify the maintenance issue safely.");
    }

    private static string DetermineResponsibility(string description)
    {
        if (ContainsAny(description,
            "my personal",
            "my own",
            "my microwave",
            "my refrigerator",
            "my washing machine"))
        {
            return "TENANT_OWNED_ITEM";
        }

        if (ContainsAny(description,
            "i broke",
            "i damaged",
            "accidentally broke",
            "accidentally damaged"))
        {
            return "POSSIBLE_TENANT_CAUSED_DAMAGE";
        }

        if (ContainsAny(description,
            "pipe",
            "ceiling",
            "wall",
            "roof",
            "electrical",
            "water leak",
            "plumbing"))
        {
            return "PROPERTY_RESPONSIBILITY";
        }

        return "REQUIRES_OWNER_REVIEW";
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