using SmartProperty.Api.Common;
using SmartProperty.Api.DTOs.Tenancies;

namespace SmartProperty.Api.Interfaces;

// Covers business logic for the whole Tenancy module (Tenant, Tenancy,
// Activation). Only Tenant Management methods are implemented so far.
public interface ITenancyService
{
    // ---- Tenant Management ----
    Task<CreateTenantResponseDto> CreateTenantAsync(CreateTenantDto dto, int ownerUserId);
    Task<PagedResult<TenantResponseDto>> GetTenantsAsync(TenantQueryParameters query, int ownerUserId);
    Task<TenantResponseDto?> GetTenantByIdAsync(int id, int ownerUserId);
    Task<TenantResponseDto?> UpdateTenantAsync(int id, UpdateTenantDto dto, int ownerUserId);

    // ---- Tenancy Management ----
    Task<TenancyResponseDto> CreateTenancyAsync(CreateTenancyDto dto, int ownerUserId);
    Task<TenancyResponseDto?> GetCurrentTenancyAsync(int currentUserId);
    Task<List<TenancyResponseDto>> GetTenancyHistoryAsync(int currentUserId);
    Task<bool> EndTenancyAsync(int tenancyId, EndTenancyDto dto);

    // ---- Activation PIN ----
    Task<ActivationResultDto> ActivateTenantAsync(ActivateTenantDto dto);
}