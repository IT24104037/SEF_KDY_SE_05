using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Repositories.Interfaces;

// Covers data access for the whole Tenancy module (Tenant, Tenancy,
// Activation). Activation methods will be added here in the next module.
public interface ITenancyRepository
{
    // ---- Tenant Management ----
    Task<Tenant> AddTenantAsync(Tenant tenant);
    Task<Tenant?> GetTenantByIdAsync(int id, int ownerUserId);
    Task<Tenant?> GetTenantByMobileNumberAsync(string mobileNumber);
    Task<bool> MobileNumberExistsAsync(string mobileNumber);
    Task<SmartProperty.Api.Entities.Property.Unit?> GetUnitForOwnerAsync(int unitId, int propertyId, int ownerUserId);

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
    Task UpdateTenancyAsync(Tenancy tenancy);
}