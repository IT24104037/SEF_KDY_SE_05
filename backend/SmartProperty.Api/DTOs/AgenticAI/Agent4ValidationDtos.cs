using System;
using System.Collections.Generic;

namespace SmartProperty.Api.DTOs.AgenticAI;

public class Agent4ValidateWorkerRequestDto
{
    public int MaintenanceRequestId { get; set; }
    public int WorkerId { get; set; }
    public string? Category { get; set; }
    public string? RequiredSkill { get; set; }
    public string? Priority { get; set; }
    public string? SafetyConcern { get; set; }
    public bool IsEmergency { get; set; }
    public DateTime? SuggestedDateTime { get; set; }
}

public class Agent4ValidationDetailResponseDto
{
    public int Id { get; set; }
    public int MaintenanceRequestId { get; set; }
    public int? WorkerId { get; set; }
    public string? WorkerName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public double RiskScore { get; set; }
    public double ConfidenceScore { get; set; }
    public List<string> PassedRules { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Violations { get; set; } = new();
    public string? RecommendedAction { get; set; }
    public object? MemoryDetails { get; set; }
    public DateTime ValidatedAt { get; set; }
}
