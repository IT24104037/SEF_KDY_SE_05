using SmartProperty.Api.AgenticAI.Agents;
using SmartProperty.Api.AgenticAI.Contracts;
using SmartProperty.Api.AgenticAI.Validators;

namespace SmartProperty.Api.Services;

public class Agent2MaintenanceAnalysisService
{
    private readonly MaintenanceAnalysisAgent _agent;
    private readonly AgentOutputValidator _validator;

    public Agent2MaintenanceAnalysisService(
        MaintenanceAnalysisAgent agent,
        AgentOutputValidator validator)
    {
        _agent = agent;
        _validator = validator;
    }

    public async Task<AnalysisOutput> AnalyzeAsync(
        AnalysisInput input,
        CancellationToken cancellationToken = default)
    {
        var result = await _agent.AnalyzeAsync(
            input,
            cancellationToken);

        if (!_validator.Validate(result, out var errors))
        {
            throw new InvalidOperationException(
                $"Agent 2 output validation failed: {string.Join("; ", errors)}");
        }

        return result;
    }
}