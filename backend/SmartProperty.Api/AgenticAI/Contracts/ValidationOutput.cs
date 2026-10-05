using System;
using System.Collections.Generic;
using SmartProperty.Api.Entities.AgenticAI;

namespace SmartProperty.Api.AgenticAI.Contracts;

/// <summary>
/// Output contract produced by Agent 4 (Validation & Safety Agent).
/// Contains the deterministic safety & compliance verdict, risk score, passed rules, warnings, and violations.
/// </summary>
public class ValidationOutput
{
    public int MaintenanceRequestId { get; set; }

    public int? WorkerId { get; set; }

    public ValidationStatus Status { get; set; } = ValidationStatus.Pass;

    public string Summary { get; set; } = string.Empty;

    public double RiskScore { get; set; }

    public double ConfidenceScore { get; set; } = 1.0;

    public List<string> PassedRules { get; set; } = new();

    public List<string> Warnings { get; set; } = new();

    public List<string> Violations { get; set; } = new();

    public string RecommendedAction { get; set; } = string.Empty;

    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}
