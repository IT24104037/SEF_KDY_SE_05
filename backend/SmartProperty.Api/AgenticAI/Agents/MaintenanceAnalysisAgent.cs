using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Tools;

using SmartProperty.Api.AgenticAI.Agents;
using DocumentFormat.OpenXml.Wordprocessing;

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

        string description = NormalizeDescription(input.Description);
        
        bool isEmergencyRequest =
            string.Equals(
                input.RequestType,
                "EMERGENCY",
                StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrWhiteSpace(input.EmergencyType);

        string emergencyText =
            $"{input.EmergencyType ?? string.Empty} {description}"
                .ToLowerInvariant();

// FIRE / LIFE-SAFETY EMERGENCY
if (ContainsAny(
    emergencyText,
    "fire",
    "on fire",
    "flame",
    "flames",
    "burning",
    "electrical fire",
    "electric fire",
    "burning smell",
    "smoke and fire"))
{
    return new AnalysisOutput
    {
        DetectedProblem = "Fire / immediate life-safety emergency",
        Category = "SAFETY",
        Priority = "CRITICAL",
        RequiredSkill = "EMERGENCY_SERVICES",
        Responsibility = "EMERGENCY_SERVICES_REQUIRED",
        SafetyConcern =
            "Fire detected. Move to a safe location immediately and contact 119 Emergency Services. Do not wait for a maintenance worker.",
        Confidence = 0.99m,
        NeedsMoreInformation = false,
        EmergencyClass = "LIFE_SAFETY_EMERGENCY"
    };
}


        if (ContainsAny(
    emergencyText,
    "burning socket",
    "smoke from socket",
    "electric shock",
    "electrical shock",
    "exposed live wire",
    "live wire"))
{
    return new AnalysisOutput
    {
        DetectedProblem = "Potential life-safety electrical hazard",
        Category = "SAFETY",
        Priority = "CRITICAL",
        RequiredSkill = "Electrical",
        Responsibility = "PROPERTY_RESPONSIBILITY",
        SafetyConcern =
            "Move away from the affected area and avoid touching electrical components. Contact emergency services if there is immediate danger.",
        Confidence = 0.95m,
        NeedsMoreInformation = false,
        EmergencyClass = "LIFE_SAFETY_EMERGENCY"
    };
}



if (ContainsAny(
    description,
    "sparking",
    "spark",
    "socket sparking",
    "switch sparking",
    "wire sparking",
    "small spark",
    "intermittent sparking"))
{
    return new AnalysisOutput
    {
        DetectedProblem = "Electrical sparking problem",
        Category = "ELECTRICAL",
        Priority = "HIGH",
        RequiredSkill = "Electrical",

        Responsibility = GetResponsibility(
            input,
            "ELECTRICAL"),

        SafetyConcern =
            "Avoid using or touching the affected electrical fitting until it is inspected.",

        Confidence = 0.92m,
        NeedsMoreInformation = false,

        EmergencyClass =
            "URGENT_MAINTENANCE"
    };
}
        

        if (ContainsAny(description,
            "heavy leak",
             " water leak",
            "water leaking",
            "water leakage",
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

       if (ContainsAny(
            description,
            "light not working",
            "switch not working",
            "socket not working",
            "power failure",
            "electricity problem",
            "electrical problem",
            "damaged wire",
            "damaged wiring",
             "light",
            "bulb",
            "switch",
            "socket",
            "outlet",
            "power",
            "electric",
            "electrical",
            "electricity",
            "wire",
            "wiring",
            "circuit",
            "breaker",
            "connection not working",
            "electrical connection not working",
             "loose connection",
            "electrical wiring",
            "wiring problem",
            "circuit breaker",
            "breaker tripping"))
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
                SafetyConcern =
                    "Do not attempt electrical repairs without appropriate expertise.",
                Confidence = 0.90m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }



        // Drainage / Water Damage
if (ContainsAny(
    description,
    "drainage",
     "drain",
     "blockage",
     "flood",
     "flooding",
     "water pooling",
    "drainage water",
    "blocked drain",
    "drain blocked",
    "clogged drain",
    "drain overflow",
    "overflowing drain",
    "water damage",
    "standing water",
    "water pooling",
    "water pooled",
    "flooded floor",
    "flooded room"))
{
    return new AnalysisOutput
    {
        DetectedProblem =
            "Drainage or water damage problem",

        Category =
            "DRAINAGE_WATER_DAMAGE",

        Priority =
            "MEDIUM",

        RequiredSkill =
            "Drainage / Water Damage",

        Responsibility =
            GetResponsibility(
                input,
                "DRAINAGE_WATER_DAMAGE"),

        SafetyConcern =
            "Avoid contact with standing water if electrical hazards may be present.",

        Confidence =
            0.90m,

        NeedsMoreInformation =
            false,

        EmergencyClass =
            "NORMAL_MAINTENANCE"
    };
}
        if (ContainsAny(
            description,
            "tap",
            "faucet",
            "sink",
            "toilet",
            "pipe",
            "shower",
             "leak",
             "leaked",
          "leaking",
            "leaking tap",
            "tap leak",
            "leaking pipe",
            "pipe leak",
            "samll leak",
            "small leaking",
             "dripping",
            "toilet leak",
            "sink leak"))
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
       // Doors / Windows / Locks
            if (ContainsAny(
                description,
                "door",
                "window",
                "lock",
                "key",
                "door",
                "window",
                "lock",
                "key",
                "hinge",
                "handle",
                "door knob",
                "doorknob",
                "jammed door",
                "stuck door",
                "cannot open",
                "cannot close",
                "hinge",
                "door handle",
                "broken lock"))
            {
                return new AnalysisOutput
                {
                    DetectedProblem = "Door, window or lock problem",
                    Category = "DOORS_WINDOWS_LOCKS",
                    Priority = "MEDIUM",
                    RequiredSkill = "Doors / Windows / Locks",
                    Responsibility = GetResponsibility(
                        input,
                        "DOORS_WINDOWS_LOCKS"),
                    SafetyConcern = null,
                    Confidence = 0.86m,
                    NeedsMoreInformation = false,
                    EmergencyClass = "NORMAL_MAINTENANCE"
                };
            }
    
        if (ContainsAny(description,
             "wall",
            "ceiling",
            "roof",
            "foundation",
            "crack",
            "cracked",
            "concrete",
            "plaster",
            "structural",
            "building damage",
            "wall crack",
            "ceiling crack",
            "damaged wall",
             "structural crack",
            "foundation crack",
             "structural damage",
            "roof damage"))
        {
            return new AnalysisOutput
            {
                DetectedProblem = "Possible structural/property damage",
                Category = "STRUCTURAL",
                Priority = "MEDIUM",
                RequiredSkill = "Structural / Building",
                Responsibility = GetResponsibility(
                        input,
                        "STRUCTURAL"),
                Confidence = 0.82m,
                NeedsMoreInformation = false,
                EmergencyClass = "NORMAL_MAINTENANCE"
            };
        }

        if (ContainsAny(description,
           "air conditioner",
            "air conditioning",
            "aircon",
            "ac not working",
            "refrigerator",
            "fridge",
            "microwave",
            "washing machine",
            "appliance",
            "exhaust fan",
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
                RequiredSkill = "Other",
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
                RequiredSkill = "Other",
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


    private static string NormalizeDescription(string text)
{
    if (string.IsNullOrWhiteSpace(text))
    {
        return string.Empty;
    }

    var normalized = text
        .Trim()
        .ToLowerInvariant()
        .Replace("-", " ")
        .Replace("_", " ")
        .Replace("/", " ");

    while (normalized.Contains("  "))
    {
        normalized = normalized.Replace("  ", " ");
    }

    return normalized;
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