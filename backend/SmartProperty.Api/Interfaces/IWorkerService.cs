using SmartProperty.Api.DTOs.Workers;

namespace SmartProperty.Api.Interfaces;

public interface IWorkerService
{
    Task<WorkerResponseDto> RegisterWorkerAsync(RegisterWorkerDto dto);
    Task<WorkerListResponseDto> GetWorkersAsync(string? search = null, string? status = null, int page = 1, int pageSize = 50);
    Task<WorkerResponseDto?> GetWorkerByIdAsync(int id);
    Task<WorkerResponseDto?> GetWorkerByUserIdAsync(int userId);
    Task<WorkerResponseDto> VerifyWorkerAsync(int workerId, VerifyWorkerDto dto, int adminUserId);
}

