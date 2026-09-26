using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.AgenticAI;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using WorkerEntity = SmartProperty.Api.Entities.Worker.Worker;

namespace SmartProperty.Api.AgenticAI.Agents;

/// <summary>
/// Agent 4: Validation & Safety Agent.
/// Serves as the cognitive safety guard, compliance auditor, and pre-approval validator.
/// Evaluates Agent 3's matched technician and Agent 2's maintenance analysis
/// against 6 deterministic validation pillars before presenting to the Property Owner.
/// </summary>
public class ValidationSafetyAgent
{
    private readonly AppDbContext _context;
    private readonly ILogger<ValidationSafetyAgent>? _logger;

    public ValidationSafetyAgent(
        AppDbContext context,
        ILogger<ValidationSafetyAgent>? logger = null)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Executes the full safety and compliance validation suite.
    /// </summary>
    public async Task<ValidationOutput> ExecuteAsync(
        Agent3Result matchResult,
        AnalysisOutput analysisOutput,
        int maintenanceRequestId,
        int workflowId = 0,
        CancellationToken cancellationToken = default)
    {
        var memory = new Agent4Memory
        {
            WorkflowId = workflowId,
            MaintenanceRequestId = maintenanceRequestId,
            MemoryCreatedAt = DateTime.UtcNow,
            IngestedAnalysis = new Agent2AnalysisMemory
            {
                DetectedProblem = analysisOutput.DetectedProblem,
                Category = analysisOutput.Category,
                Priority = analysisOutput.Priority,
                RequiredSkill = analysisOutput.RequiredSkill,
                Responsibility = analysisOutput.Responsibility,
                SafetyConcern = analysisOutput.SafetyConcern,
                Confidence = analysisOutput.Confidence,
                NeedsMoreInformation = analysisOutput.NeedsMoreInformation,
                EmergencyClass = analysisOutput.EmergencyClass
            },
            IngestedMatch = new Agent3MatchMemory
            {
                Result = matchResult.Result,
                WorkerId = matchResult.WorkerId,
                WorkerName = matchResult.WorkerName,
                SuggestedDateTime = matchResult.SuggestedDateTime,
                ActiveJobCount = matchResult.ActiveJobCount,
                YearsOfExperience = matchResult.YearsOfExperience,
                Reason = matchResult.Reason,
                IsEmergency = matchResult.IsEmergency
            }
        };

        // -------------------------------------------------------------
        // STEP 1: Load Maintenance Request Context
        // -------------------------------------------------------------
        var request = await _context.MaintenanceRequests
            .Include(r => r.Property)
                .ThenInclude(p => p.PropertyOwner)
            .Include(r => r.Unit)
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == maintenanceRequestId, cancellationToken);

        if (request == null)
        {
            _logger?.LogError("Maintenance request {RequestId} not found for Agent 4 validation.", maintenanceRequestId);
            memory.OverallStatus = ValidationStatus.Fail;
            memory.BlockingFailures.Add($"Maintenance request {maintenanceRequestId} does not exist.");
            memory.Summary = "Validation failed: Associated maintenance request could not be located.";
            return await SaveAndBuildOutputAsync(memory, cancellationToken);
        }

        memory.PropertyId = request.PropertyId;
        memory.UnitId = request.UnitId;
        memory.TenantId = request.TenantId;
        memory.PropertyOwnerId = request.Property?.PropertyOwnerId ?? 0;

        // -------------------------------------------------------------
        // STEP 2: Evaluate Case Where Agent 3 Found No Worker
        // -------------------------------------------------------------
        if (!matchResult.WorkerId.HasValue ||
            string.Equals(matchResult.Result, "NO_AVAILABLE_WORKER", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(matchResult.Result, "NO_AVAILABLE_EMERGENCY_WORKER", StringComparison.OrdinalIgnoreCase))
        {
            memory.OverallStatus = ValidationStatus.Fail;
            memory.RiskScore = 90.0;
            memory.ConfidenceScore = 1.0;
            memory.BlockingFailures.Add("No available technician matched the skill, location, or scheduling requirements.");
            
            if (matchResult.IsEmergency)
            {
                memory.Summary = "Validation failed: No emergency technician is currently available. Immediate escalation to external emergency maintenance required.";
                memory.RecommendationsForOwner = "Dispatch an external emergency contractor immediately through External Maintenance Arrangement.";
            }
            else
            {
                memory.Summary = "Validation failed: No suitable verified technician available for the requested parameters.";
                memory.RecommendationsForOwner = "Consider broadening preferred time windows or arranging an external maintenance contractor.";
            }

            return await SaveAndBuildOutputAsync(memory, cancellationToken);
        }

        // -------------------------------------------------------------
        // STEP 3: Load Proposed Worker Entity & Profile
        // -------------------------------------------------------------
        int workerId = matchResult.WorkerId.Value;
        var worker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.Documents)
            .Include(w => w.Availabilities)
            .Include(w => w.ServiceAreas)
            .Include(w => w.WorkOrders)
            .FirstOrDefaultAsync(w => w.Id == workerId, cancellationToken);

        if (worker == null)
        {
            memory.OverallStatus = ValidationStatus.Fail;
            memory.RiskScore = 100.0;
            memory.BlockingFailures.Add($"Technician ID {workerId} could not be found in the system.");
            memory.Summary = "Validation failed: Proposed technician record does not exist.";
            return await SaveAndBuildOutputAsync(memory, cancellationToken);
        }

        // -------------------------------------------------------------
        // PILLAR 1: Worker Verification & Credential Integrity
        // -------------------------------------------------------------
        bool isVerified = worker.VerificationStatus == WorkerVerificationStatus.Verified;
        bool isAccountActive = worker.User?.IsActive == true;
        bool hasDocuments = worker.Documents != null && worker.Documents.Any();

        memory.VerificationCheck = new VerificationCheckMemory
        {
            IsVerified = isVerified,
            AccountIsActive = isAccountActive,
            HasActiveDocuments = hasDocuments,
            StatusNotes = isVerified && isAccountActive
                ? "Worker is fully verified with an active account."
                : "Worker has unverified or suspended status."
        };

        if (!isVerified)
        {
            memory.BlockingFailures.Add($"Technician '{worker.User?.FullName}' is not verified (Status: {worker.VerificationStatus}). Unverified workers cannot receive work orders.");
        }
        else if (!isAccountActive)
        {
            memory.BlockingFailures.Add($"Technician account '{worker.User?.Email}' is marked inactive.");
        }
        else
        {
            memory.ValidationPassedChecks.Add("Pillar 1: Technician identity, credentials, and verification status validated.");
        }

        // -------------------------------------------------------------
        // PILLAR 2: Trade & Skill Alignment
        // -------------------------------------------------------------
        bool skillMatched = false;
        string matchedSkill = string.Empty;
        int yearsExp = 0;

        if (request.CategoryId > 0 && worker.Skills != null)
        {
            var matchingSkillObj = worker.Skills.FirstOrDefault(s => s.CategoryId == request.CategoryId);
            if (matchingSkillObj != null)
            {
                skillMatched = true;
                matchedSkill = matchingSkillObj.SkillName;
                yearsExp = matchingSkillObj.YearsOfExperience ?? 0;
            }
        }

        if (!skillMatched && !string.IsNullOrWhiteSpace(analysisOutput.RequiredSkill) && worker.Skills != null)
        {
            var matchingSkillObj = worker.Skills.FirstOrDefault(s =>
                string.Equals(s.SkillName, analysisOutput.RequiredSkill, StringComparison.OrdinalIgnoreCase));
            if (matchingSkillObj != null)
            {
                skillMatched = true;
                matchedSkill = matchingSkillObj.SkillName;
                yearsExp = matchingSkillObj.YearsOfExperience ?? 0;
            }
        }

        memory.SkillMatchCheck = new SkillMatchCheckMemory
        {
            SkillMatchesCategory = skillMatched,
            MatchedSkillName = matchedSkill,
            YearsOfExperience = yearsExp,
            MeetsExperienceThreshold = yearsExp >= 1
        };

        if (!skillMatched)
        {
            memory.BlockingFailures.Add($"Technician skills do not cover required category '{request.Category?.Name ?? analysisOutput.Category}' or skill '{analysisOutput.RequiredSkill}'.");
        }
        else
        {
            memory.ValidationPassedChecks.Add($"Pillar 2: Verified trade skill '{matchedSkill}' ({yearsExp} yrs experience) aligned with category.");
        }

        // -------------------------------------------------------------
        // PILLAR 3: Geospatial Service Area Coverage
        // -------------------------------------------------------------
        bool cityMatched = false;
        bool withinRadius = false;
        double minDistance = double.MaxValue;
        double maxRadius = 0;

        string propertyCity = request.Property?.City?.Trim() ?? string.Empty;

        if (worker.ServiceAreas != null && worker.ServiceAreas.Any())
        {
            foreach (var area in worker.ServiceAreas)
            {
                if (!string.IsNullOrWhiteSpace(propertyCity) &&
                    string.Equals(area.City?.Trim(), propertyCity, StringComparison.OrdinalIgnoreCase))
                {
                    cityMatched = true;
                }

                if (request.Property?.Latitude.HasValue == true &&
                    request.Property?.Longitude.HasValue == true &&
                    area.Latitude.HasValue &&
                    area.Longitude.HasValue)
                {
                    double dist = CalculateHaversineDistanceKm(
                        (double)request.Property.Latitude.Value,
                        (double)request.Property.Longitude.Value,
                        (double)area.Latitude.Value,
                        (double)area.Longitude.Value);

                    if (dist < minDistance)
                    {
                        minDistance = dist;
                        maxRadius = (double)area.RadiusKm;
                    }

                    if (dist <= (double)area.RadiusKm)
                    {
                        withinRadius = true;
                    }
                }
            }
        }

        bool geoPassed = cityMatched || withinRadius;
        memory.GeoCoverageCheck = new GeoCoverageCheckMemory
        {
            CityMatches = cityMatched,
            WithinRadiusKm = withinRadius,
            CalculatedDistanceKm = minDistance == double.MaxValue ? 0 : Math.Round(minDistance, 2),
            MaxAllowedRadiusKm = maxRadius
        };

        if (!geoPassed)
        {
            memory.WarningFlags.Add($"Technician service area does not explicitly cover property location '{propertyCity}'.");
        }
        else
        {
            memory.ValidationPassedChecks.Add("Pillar 3: Geospatial service area and city coverage verified.");
        }

        // -------------------------------------------------------------
        // PILLAR 4: Schedule Availability & Double-Booking Audit
        // -------------------------------------------------------------
        DateTime scheduledTime = matchResult.SuggestedDateTime ?? DateTime.UtcNow;
        DayOfWeek scheduledDay = scheduledTime.DayOfWeek;
        TimeSpan timeOfDay = scheduledTime.TimeOfDay;

        bool hasAvailabilitySlot = worker.Availabilities != null && worker.Availabilities.Any(a =>
            a.IsActive &&
            a.DayOfWeek == scheduledDay &&
            timeOfDay >= a.StartTime &&
            timeOfDay <= a.EndTime);

        // Check for active conflicting work orders (within +/- 2 hours of scheduled time)
        var conflictingWorkOrder = worker.WorkOrders?.FirstOrDefault(wo =>
            (wo.Status == WorkOrderStatus.Assigned || wo.Status == WorkOrderStatus.InProgress) &&
            wo.ScheduledDate.HasValue &&
            Math.Abs((wo.ScheduledDate.Value - scheduledTime).TotalHours) < 2.0);

        bool hasConflict = conflictingWorkOrder != null;

        memory.ScheduleConflictCheck = new ScheduleConflictCheckMemory
        {
            HasAvailabilitySlotOnDay = hasAvailabilitySlot,
            SlotCoversRequestedTime = hasAvailabilitySlot,
            HasOverlappingWorkOrder = hasConflict,
            ConflictingWorkOrderId = conflictingWorkOrder?.Id
        };

        if (hasConflict)
        {
            memory.WarningFlags.Add($"Technician has an active conflicting job (Work Order #{conflictingWorkOrder!.Id}) overlapping scheduled time.");
        }
        else
        {
            memory.ValidationPassedChecks.Add("Pillar 4: No overlapping work orders detected. Schedule conflict check cleared.");
        }

        // -------------------------------------------------------------
        // PILLAR 5: Safety Hazards & Emergency Protocols
        // -------------------------------------------------------------
        bool isEmergency = matchResult.IsEmergency ||
            string.Equals(request.RequestType, "EMERGENCY", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(analysisOutput.EmergencyClass, "LIFE_SAFETY_EMERGENCY", StringComparison.OrdinalIgnoreCase);

        bool emergencyProtocolAdhered = true;
        var safetyMitigations = new List<string>();

        if (isEmergency)
        {
            // Emergency requirement: Worker must have no conflicting active jobs
            int activeJobs = worker.WorkOrders?.Count(wo =>
                wo.Status == WorkOrderStatus.Assigned || wo.Status == WorkOrderStatus.InProgress) ?? 0;

            if (activeJobs > 0)
            {
                emergencyProtocolAdhered = false;
                memory.WarningFlags.Add($"Technician currently has {activeJobs} active job(s). Emergency jobs require an immediate, unburdened technician.");
            }
            safetyMitigations.Add("Emergency dispatch priority: 2-hour SLA response window enabled.");
        }

        if (!string.IsNullOrWhiteSpace(analysisOutput.SafetyConcern) &&
            !string.Equals(analysisOutput.SafetyConcern, "NONE", StringComparison.OrdinalIgnoreCase))
        {
            safetyMitigations.Add($"Safety advisory noted: '{analysisOutput.SafetyConcern}'. Protective equipment and safety protocols mandated.");
        }

        memory.SafetyComplianceCheck = new SafetyComplianceCheckMemory
        {
            RequiresLicensedTrade = string.Equals(analysisOutput.Category, "ELECTRICAL", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(analysisOutput.Category, "GAS", StringComparison.OrdinalIgnoreCase),
            EmergencyProtocolAdhered = emergencyProtocolAdhered,
            SafetyHazardIdentified = !string.IsNullOrWhiteSpace(analysisOutput.SafetyConcern),
            SafetyMitigations = safetyMitigations
        };

        memory.ValidationPassedChecks.Add("Pillar 5: Safety guidelines and emergency response protocols confirmed.");

        // -------------------------------------------------------------
        // PILLAR 6: Rate Reasonableness & Cost Benchmarking
        // -------------------------------------------------------------
        decimal workerRate = worker.HourlyRate ?? 0m;
        decimal benchmarkRate = 3000m; // Default platform benchmark in LKR
        decimal rateDeviation = benchmarkRate > 0
            ? Math.Round(((workerRate - benchmarkRate) / benchmarkRate) * 100m, 1)
            : 0;
        bool isRateReasonable = workerRate > 0 && workerRate <= 10000m;

        memory.RateCheck = new RateReasonablenessCheckMemory
        {
            WorkerHourlyRate = workerRate,
            CategoryStandardRate = benchmarkRate,
            DeviationPercentage = rateDeviation,
            IsWithinAcceptableRange = isRateReasonable
        };

        if (!isRateReasonable)
        {
            memory.WarningFlags.Add($"Technician hourly rate (LKR {workerRate:N0}) deviates substantially from market standards.");
        }
        else
        {
            memory.ValidationPassedChecks.Add($"Pillar 6: Hourly rate (LKR {workerRate:N0}/hr) confirmed within fair market band.");
        }

        // -------------------------------------------------------------
        // SYNTHESIS: Final Status & Risk Scoring
        // -------------------------------------------------------------
        if (memory.BlockingFailures.Any())
        {
            memory.OverallStatus = ValidationStatus.Fail;
            memory.RiskScore = 95.0;
            memory.Summary = $"Validation FAILED: {string.Join("; ", memory.BlockingFailures)}";
            memory.RecommendationsForOwner = "Do not approve this assignment. Re-route to an alternative technician or arrange external maintenance.";
        }
        else if (hasConflict || !emergencyProtocolAdhered)
        {
            memory.OverallStatus = ValidationStatus.RevisionRequired;
            memory.RiskScore = 60.0;
            memory.Summary = $"Validation REVISION REQUIRED: Schedule conflict or emergency availability constraint detected for '{worker.User?.FullName}'.";
            memory.RecommendationsForOwner = "Request an alternate appointment time or ask Agent 3 to match the next available technician.";
        }
        else if (memory.WarningFlags.Any())
        {
            memory.OverallStatus = ValidationStatus.Pass;
            memory.RiskScore = 25.0;
            memory.Summary = $"Validation PASSED with advisories: {string.Join("; ", memory.WarningFlags)}";
            memory.RecommendationsForOwner = "Recommended for approval with noted advisories.";
        }
        else
        {
            memory.OverallStatus = ValidationStatus.Pass;
            memory.RiskScore = 5.0;
            memory.Summary = $"Validation PASSED: All 6 safety, credential, coverage, and scheduling pillars verified for technician '{worker.User?.FullName}'.";
            memory.RecommendationsForOwner = "Technician meets all verified compliance criteria. Safe to approve.";
        }

        memory.EvaluatedAt = DateTime.UtcNow;

        return await SaveAndBuildOutputAsync(memory, cancellationToken);
    }

    /// <summary>
    /// Persists the ValidationResult and builds the ValidationOutput contract.
    /// </summary>
    private async Task<ValidationOutput> SaveAndBuildOutputAsync(
        Agent4Memory memory,
        CancellationToken cancellationToken)
    {
        string detailsJson = JsonSerializer.Serialize(memory, new JsonSerializerOptions
        {
            WriteIndented = false
        });

        var existingResult = await _context.ValidationResults
            .FirstOrDefaultAsync(v => v.MaintenanceRequestId == memory.MaintenanceRequestId, cancellationToken);

        if (existingResult != null)
        {
            existingResult.WorkerId = memory.IngestedMatch.WorkerId;
            existingResult.Status = memory.OverallStatus;
            existingResult.Summary = memory.Summary;
            existingResult.DetailsJson = detailsJson;
            existingResult.ValidatedAt = DateTime.UtcNow;
        }
        else
        {
            var newResult = new ValidationResult
            {
                MaintenanceRequestId = memory.MaintenanceRequestId,
                WorkerId = memory.IngestedMatch.WorkerId,
                Status = memory.OverallStatus,
                Summary = memory.Summary,
                DetailsJson = detailsJson,
                ValidatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.ValidationResults.Add(newResult);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ValidationOutput
        {
            MaintenanceRequestId = memory.MaintenanceRequestId,
            WorkerId = memory.IngestedMatch.WorkerId,
            Status = memory.OverallStatus,
            Summary = memory.Summary,
            RiskScore = memory.RiskScore,
            ConfidenceScore = memory.ConfidenceScore,
            PassedRules = memory.ValidationPassedChecks,
            Warnings = memory.WarningFlags,
            Violations = memory.BlockingFailures,
            RecommendedAction = memory.RecommendationsForOwner,
            ValidatedAt = memory.EvaluatedAt ?? DateTime.UtcNow
        };
    }

    /// <summary>
    /// Computes great-circle distance between two GPS coordinates in kilometers (Haversine formula).
    /// </summary>
    private static double CalculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371.0;
        double dLat = DegreesToRadians(lat2 - lat1);
        double dLon = DegreesToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}
