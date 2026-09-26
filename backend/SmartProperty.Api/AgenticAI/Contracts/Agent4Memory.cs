using System;
using System.Collections.Generic;
using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.AgenticAI.Contracts;

/// <summary>
/// Working memory and state retention model for Agent 4 (Validation & Safety Agent).
/// Encapsulates short-term context, ingested upstream agent outputs,
/// safety/compliance verification checks, episodic historical memory, and final decision state.
/// </summary>
public class Agent4Memory
{
    // ==========================================
    // 1. EXECUTION CONTEXT (Working Memory)
    // ==========================================
    public int WorkflowId { get; set; }
    public int MaintenanceRequestId { get; set; }
    public int PropertyId { get; set; }
    public int? UnitId { get; set; }
    public int TenantId { get; set; }
    public int PropertyOwnerId { get; set; }
    public DateTime MemoryCreatedAt { get; set; } = DateTime.UtcNow;

    // ==========================================
    // 2. INGESTED UPSTREAM MEMORIES
    // ==========================================
    public Agent2AnalysisMemory IngestedAnalysis { get; set; } = new();
    public Agent3MatchMemory IngestedMatch { get; set; } = new();

    // ==========================================
    // 3. EVALUATION SCRATCHPAD (Cognitive State)
    // ==========================================
    public VerificationCheckMemory VerificationCheck { get; set; } = new();
    public SkillMatchCheckMemory SkillMatchCheck { get; set; } = new();
    public GeoCoverageCheckMemory GeoCoverageCheck { get; set; } = new();
    public ScheduleConflictCheckMemory ScheduleConflictCheck { get; set; } = new();
    public SafetyComplianceCheckMemory SafetyComplianceCheck { get; set; } = new();
    public RateReasonablenessCheckMemory RateCheck { get; set; } = new();

    // ==========================================
    // 4. EPISODIC & HISTORICAL MEMORY (Retrieved Long-term)
    // ==========================================
    public WorkerHistoricalProfileMemory WorkerHistory { get; set; } = new();
    public RequestHistoricalContextMemory RequestHistory { get; set; } = new();

    // ==========================================
    // 5. SYNTHESIS & VALIDATION DECISION STATE
    // ==========================================
    public ValidationStatus OverallStatus { get; set; } = ValidationStatus.Pass;
    public double RiskScore { get; set; } = 0.0;
    public double ConfidenceScore { get; set; } = 1.0;
    public string Summary { get; set; } = string.Empty;
    public List<string> ValidationPassedChecks { get; set; } = new();
    public List<string> WarningFlags { get; set; } = new();
    public List<string> BlockingFailures { get; set; } = new();
    public string RecommendationsForOwner { get; set; } = string.Empty;
    public DateTime? EvaluatedAt { get; set; }
}

public class Agent2AnalysisMemory
{
    public string DetectedProblem { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string RequiredSkill { get; set; } = string.Empty;
    public string Responsibility { get; set; } = string.Empty;
    public string? SafetyConcern { get; set; }
    public decimal Confidence { get; set; }
    public bool NeedsMoreInformation { get; set; }
    public string EmergencyClass { get; set; } = string.Empty;
}

public class Agent3MatchMemory
{
    public string Result { get; set; } = string.Empty;
    public int? WorkerId { get; set; }
    public string? WorkerName { get; set; }
    public DateTime? SuggestedDateTime { get; set; }
    public int ActiveJobCount { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? Reason { get; set; }
    public bool IsEmergency { get; set; }
}

public class VerificationCheckMemory
{
    public bool IsVerified { get; set; }
    public bool HasActiveDocuments { get; set; }
    public bool AccountIsActive { get; set; }
    public string StatusNotes { get; set; } = string.Empty;
}

public class SkillMatchCheckMemory
{
    public bool SkillMatchesCategory { get; set; }
    public string MatchedSkillName { get; set; } = string.Empty;
    public int YearsOfExperience { get; set; }
    public bool MeetsExperienceThreshold { get; set; }
}

public class GeoCoverageCheckMemory
{
    public bool CityMatches { get; set; }
    public bool WithinRadiusKm { get; set; }
    public double CalculatedDistanceKm { get; set; }
    public double MaxAllowedRadiusKm { get; set; }
}

public class ScheduleConflictCheckMemory
{
    public bool HasAvailabilitySlotOnDay { get; set; }
    public bool SlotCoversRequestedTime { get; set; }
    public bool HasOverlappingWorkOrder { get; set; }
    public int? ConflictingWorkOrderId { get; set; }
}

public class SafetyComplianceCheckMemory
{
    public bool RequiresLicensedTrade { get; set; }
    public bool EmergencyProtocolAdhered { get; set; }
    public bool SafetyHazardIdentified { get; set; }
    public List<string> SafetyMitigations { get; set; } = new();
}

public class RateReasonablenessCheckMemory
{
    public decimal WorkerHourlyRate { get; set; }
    public decimal CategoryStandardRate { get; set; }
    public decimal DeviationPercentage { get; set; }
    public bool IsWithinAcceptableRange { get; set; }
}

public class WorkerHistoricalProfileMemory
{
    public int TotalCompletedJobs { get; set; }
    public int TotalCancelledJobs { get; set; }
    public double AverageRating { get; set; }
    public double ReliabilityScore { get; set; }
}

public class RequestHistoricalContextMemory
{
    public int PreviousRequestsForUnit { get; set; }
    public bool HasRecurringIssueHistory { get; set; }
    public int PriorValidationAttempts { get; set; }
}
