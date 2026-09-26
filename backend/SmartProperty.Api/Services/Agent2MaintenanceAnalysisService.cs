using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Validators;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Maintenance;
using Microsoft.EntityFrameworkCore;

namespace SmartProperty.Api.Services;

public class Agent2MaintenanceAnalysisService
{
    private readonly MaintenanceAnalysisAgent _agent;
    private readonly AgentOutputValidator _validator;
    private readonly AppDbContext _dbContext;

    public Agent2MaintenanceAnalysisService(
        MaintenanceAnalysisAgent agent,
        AgentOutputValidator validator,
        AppDbContext dbContext)
    {
        _agent = agent;
        _validator = validator;
        _dbContext = dbContext;
    }

    public async Task<AnalysisOutput> AnalyzeAsync(
        AnalysisInput input,
        CancellationToken cancellationToken = default)
    {
        if (input == null)
        {
            throw new ArgumentNullException(nameof(input));
        }

        var result = await _agent.AnalyzeAsync(
            input,
            cancellationToken);

        if (!_validator.Validate(result, out var errors))
        {
            throw new InvalidOperationException(
                $"Agent 2 output validation failed: {string.Join("; ", errors)}");
        }

        var existing =
            await _dbContext.MaintenanceAnalysisResults
                .FirstOrDefaultAsync(
                    x => x.MaintenanceRequestId ==
                         input.MaintenanceRequestId,
                    cancellationToken);

        if (existing == null)
        {
            existing = new MaintenanceAnalysisResult
            {
                MaintenanceRequestId =
                    input.MaintenanceRequestId
            };

            _dbContext.MaintenanceAnalysisResults.Add(existing);
        }

        existing.DetectedProblem = result.DetectedProblem;
        existing.Category = result.Category;
        existing.Priority = result.Priority;
        existing.RequiredSkill = result.RequiredSkill;
        existing.Responsibility = result.Responsibility;
        existing.SafetyConcern = result.SafetyConcern;
        existing.Confidence = result.Confidence;
        existing.NeedsMoreInformation = result.NeedsMoreInformation;
        existing.EmergencyClass = result.EmergencyClass;
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return result;
    }
}