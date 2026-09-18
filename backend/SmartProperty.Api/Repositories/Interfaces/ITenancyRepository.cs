using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Repositories.Interfaces;

// Covers data access for the whole Tenancy module: Tenant, Tenancy, and
// Activation PIN (plus the User-creation step activation needs).
public interface ITenancyRepository
{
    // ---- Tenant Management ----
    Task<Tenant> AddTenantAsync(Tenant tenant);
    Task<Tenant?> GetTenantByIdAsync(int id);
    Task<Tenant?> GetTenantByIdAsync(int id, int ownerUserId);
    Task<Tenant?> GetTenantByMobileNumberAsync(string mobileNumber);
    Task<bool> MobileNumberExistsAsync(string mobileNumber);
    Task<SmartProperty.Api.Entities.Property.Unit?> GetUnitForOwnerAsync(
        int unitId, int propertyId, int ownerUserId);

    Task<(List<Tenant> Items, int TotalCount)> GetTenantsAsync(
        string? search,
        bool? isActive,
        string sortBy,
        bool descending,
        int page,
        int pageSize);

    Task<(List<Tenant> Items, int TotalCount)> GetTenantsAsync(
        int ownerUserId,
        string? search,
        bool? isActive,
        int? propertyId,
        int? unitId,
        string sortBy,
        bool descending,
        int page,
        int pageSize);

    Task UpdateTenantAsync(Tenant tenant);

    // ---- Tenancy Management ----
    Task<bool> HasActiveTenancyForUnitAsync(int unitId);
    Task<Tenancy> AddTenancyAsync(Tenancy tenancy);
    Task<Tenancy?> GetTenancyByIdAsync(int id);
    Task<Tenancy?> GetActiveTenancyByUserIdAsync(int userId);
    Task<List<Tenancy>> GetTenancyHistoryByUserIdAsync(int userId);
    Task<List<Tenancy>> GetTenanciesByTenantIdAsync(int tenantId);
    Task UpdateTenancyAsync(Tenancy tenancy);

    // ---- Activation PIN ----
    Task<TenantActivationPin> AddActivationPinAsync(TenantActivationPin pin);
    Task<TenantActivationPin?> GetLatestUnusedPinAsync(int tenantId);
    Task UpdateActivationPinAsync(TenantActivationPin pin);

    // ---- Shared User creation (needed only at activation success) ----
    Task<User> AddUserAsync(User user);
    Task<int> GetRoleIdByNameAsync(string roleName);
}
