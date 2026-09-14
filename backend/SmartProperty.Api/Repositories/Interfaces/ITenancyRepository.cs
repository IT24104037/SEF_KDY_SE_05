using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Repositories.Interfaces;

// Covers data access for the whole Tenancy module (Tenant, Tenancy,
// Activation). Only Tenant methods are implemented so far — Tenancy and
// Activation methods will be added here when those modules are built.
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
}