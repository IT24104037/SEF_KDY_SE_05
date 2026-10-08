using System.Collections.Generic;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Validators;

namespace SmartProperty.Tests.AgenticAI;

/// <summary>
/// Unit tests for AgentOutputValidator.
///
/// SE3110 — Member 4: Agentic AI Testing
/// Test ID : AI-03
/// Author  : Member 4
/// Date    : 2026-10-08
///
/// Covers the business rule at AgentOutputValidator.cs line 107–112:
///   "Life-safety emergencies must contain a safety warning."
/// </summary>
public class AgentOutputValidatorTests
{
    // -------------------------------------------------------------------------
    // Helper: builds a fully valid AnalysisOutput that satisfies every rule
    // in AgentOutputValidator so that individual tests can break exactly one
    // field at a time without triggering unrelated errors.
    // -------------------------------------------------------------------------
    private static AnalysisOutput ValidLifeSafetyOutput() => new AnalysisOutput
    {
        // Rule: DetectedProblem must not be null/whitespace
        DetectedProblem = "Fire detected in the building — immediate evacuation required.",

        // Rule: must be one of the AllowedCategories set
        Category = "SAFETY",

        // Rule: must be one of the AllowedPriorities set
        Priority = "CRITICAL",

        // Rule: must be one of the AllowedRequiredSkills set
        RequiredSkill = "EMERGENCY_SERVICES",

        // Rule: must be one of the AllowedResponsibilities set
        Responsibility = "EMERGENCY_SERVICES_REQUIRED",

        // SafetyConcern is populated here — this is the field under test.
        // A valid life-safety output MUST have a non-null, non-empty SafetyConcern.
        SafetyConcern = "Move to a safe location immediately and contact 119 Emergency Services.",

        // Rule: must be between 0 and 1 inclusive
        Confidence = 0.99m,

        // Rule: NeedsMoreInformation && Confidence > 0.70 is not allowed
        NeedsMoreInformation = false,

        // Rule: must be one of the AllowedEmergencyClasses set
        //       AND if "LIFE_SAFETY_EMERGENCY", SafetyConcern must be present
        EmergencyClass = "LIFE_SAFETY_EMERGENCY"
    };

    // =========================================================================
    // AI-03-T1 — Baseline: verify the helper itself produces a valid output
    // =========================================================================

    /// <summary>
    /// Confirms that the ValidLifeSafetyOutput baseline passes all validator
    /// rules. If this test fails, the baseline helper is broken, not the
    /// production rule under test.
    /// </summary>
    [Fact]
    public void AgentOutputValidator_ValidLifeSafetyOutput_PassesAllRules()
    {
        // Arrange
        var validator = new AgentOutputValidator();
        var output    = ValidLifeSafetyOutput();

        // Act
        bool result = validator.Validate(output, out List<string> errors);

        // Assert
        Assert.True(result,
            $"Baseline output should be valid but validator returned errors: " +
            $"{string.Join("; ", errors)}");
        Assert.Empty(errors);
    }

    // =========================================================================
    // AI-03-T2 — Core test: LIFE_SAFETY_EMERGENCY with null SafetyConcern
    // =========================================================================

    /// <summary>
    /// Verifies that AgentOutputValidator rejects a life-safety emergency
    /// AnalysisOutput when SafetyConcern is null.
    ///
    /// Business rule (AgentOutputValidator.cs line 107–112):
    ///   If EmergencyClass == "LIFE_SAFETY_EMERGENCY"
    ///   and SafetyConcern is null or whitespace,
    ///   the validator must add the error:
    ///   "Life-safety emergencies must contain a safety warning."
    ///
    /// Rationale: The downstream ValidationSafetyAgent (Agent 4) and the
    /// property owner dashboard depend on this warning being present for every
    /// life-safety event. An absent warning could leave occupants without
    /// critical evacuation or emergency-contact guidance.
    /// </summary>
    [Fact]
    public void AgentOutputValidator_LifeSafetyEmergency_WithNullSafetyConcern_ReturnsInvalidWithExpectedError()
    {
        // Arrange
        var validator = new AgentOutputValidator();

        // Start from a fully valid life-safety output, then remove SafetyConcern.
        // This is the only field that changes — every other rule still passes.
        var output = ValidLifeSafetyOutput();
        output.SafetyConcern = null;           // <-- violates the rule under test

        // Act
        bool result = validator.Validate(output, out List<string> errors);

        // Assert — overall result must be false
        Assert.False(result,
            "Validator should reject a LIFE_SAFETY_EMERGENCY output with no SafetyConcern.");

        // Assert — the specific error message must be present
        Assert.Contains(
            errors,
            e => e == "Life-safety emergencies must contain a safety warning.");

        // Assert — this must be the only error (every other field is valid)
        Assert.Single(errors);
        // Confirms only the SafetyConcern violation is reported; all other rules pass.
    }

    // =========================================================================
    // AI-03-T3 — Boundary: whitespace-only SafetyConcern is also rejected
    // =========================================================================

    /// <summary>
    /// Verifies that a SafetyConcern containing only whitespace is treated the
    /// same as null, because the validator uses string.IsNullOrWhiteSpace.
    /// This closes a potential bypass where an empty string or spaces could
    /// slip through while appearing non-null.
    /// </summary>
    [Fact]
    public void AgentOutputValidator_LifeSafetyEmergency_WithWhitespaceSafetyConcern_ReturnsInvalidWithExpectedError()
    {
        // Arrange
        var validator = new AgentOutputValidator();
        var output    = ValidLifeSafetyOutput();
        output.SafetyConcern = "   ";          // whitespace only — must also be rejected

        // Act
        bool result = validator.Validate(output, out List<string> errors);

        // Assert
        Assert.False(result,
            "Validator should reject a LIFE_SAFETY_EMERGENCY output with whitespace-only SafetyConcern.");

        Assert.Contains(
            errors,
            e => e == "Life-safety emergencies must contain a safety warning.");

        Assert.Single(errors);
    }
}
