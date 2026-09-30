using SmartProperty.Api.AgenticAI.Contracts;

namespace SmartProperty.Api.AgenticAI.Validators;

/// <summary>
/// Applies deterministic schema and business-rule validation to a <see cref="PlannerOutput"/>
/// produced by the Agent 1 Planner &amp; Coordinator before it is accepted, persisted, or
/// handed off to downstream agents.
///
/// Validation is intentionally deterministic (no external calls, no randomness) so that a
/// failed output can always be safely rejected without partial side effects.
/// </summary>
public class PlannerOutputValidator
{
    /// <summary>
    /// Validates the supplied <paramref name="output"/> against the Agent 1 output contract.
    /// </summary>
    /// <param name="output">
    ///     The <see cref="PlannerOutput"/> returned by <c>PlannerCoordinatorAgent.CreatePlanAsync</c>.
    ///     May be <c>null</c> if the agent failed to produce any result.
    /// </param>
    /// <param name="expectedRequestId">
    ///     The maintenance request ID that initiated the workflow.
    ///     The output's <see cref="PlannerOutput.MaintenanceRequestId"/> must match exactly.
    /// </param>
    /// <param name="errors">
    ///     Out parameter populated with one human-readable message per violated rule.
    ///     Empty when validation passes.
    /// </param>
    /// <returns>
    ///     <c>true</c> if all rules pass; <c>false</c> if one or more rules are violated.
    /// </returns>
    public bool Validate(
        PlannerOutput? output,
        int expectedRequestId,
        out List<string> errors)
    {
        errors = new List<string>();

        // ── Null guard ────────────────────────────────────────────────────────────
        if (output == null)
        {
            errors.Add("PlannerOutput is null.");
            return false;
        }

        // ── Schema / structural rules ─────────────────────────────────────────────

        if (output.MaintenanceRequestId <= 0)
            errors.Add(
                $"MaintenanceRequestId must be greater than zero (was {output.MaintenanceRequestId}).");

        if (output.MaintenanceRequestId != expectedRequestId)
            errors.Add(
                $"MaintenanceRequestId {output.MaintenanceRequestId} does not match " +
                $"the expected request ID {expectedRequestId}.");

        if (string.IsNullOrWhiteSpace(output.Summary))
            errors.Add("Summary must not be null or whitespace.");

        if (string.IsNullOrWhiteSpace(output.RelevantContextSummary))
            errors.Add("RelevantContextSummary must not be null or whitespace.");

        if (output.ResolutionSteps == null || output.ResolutionSteps.Count == 0)
        {
            errors.Add("ResolutionSteps must not be null or empty.");
        }
        else if (output.ResolutionSteps.Count != 4)
        {
            errors.Add(
                $"ResolutionSteps must contain exactly 4 items " +
                $"(found {output.ResolutionSteps.Count}).");
        }
        else
        {
            for (var i = 0; i < output.ResolutionSteps.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(output.ResolutionSteps[i].Title))
                    errors.Add(
                        $"ResolutionStep at index {i} " +
                        $"(StepNumber {output.ResolutionSteps[i].StepNumber}) " +
                        $"must have a non-empty Title.");
            }
        }

        if (output.PlannedAt == DateTime.MinValue)
            errors.Add("PlannedAt must not be the default DateTime value.");

        // ── Business-rule rules ───────────────────────────────────────────────────

        // A successful output must not carry an error message; that would be contradictory.
        if (output.IsSuccess && !string.IsNullOrWhiteSpace(output.ErrorMessage))
            errors.Add(
                "ErrorMessage must be null or empty when IsSuccess is true.");

        // A failed output with no error message provides no audit information.
        if (!output.IsSuccess && string.IsNullOrWhiteSpace(output.ErrorMessage))
            errors.Add(
                "ErrorMessage must not be null or whitespace when IsSuccess is false.");

        return errors.Count == 0;
    }
}
