using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Repositories.Interfaces;

namespace SmartProperty.Api.Repositories.Implementations;

public class TenancyRepository : ITenancyRepository
{
    private readonly AppDbContext _context;

    public TenancyRepository(AppDbContext context) => _context = context;

    public async Task<Tenant> AddTenantAsync(Tenant tenant)
    {
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        return tenant;
    }

    public async Task<Tenant?> GetTenantByIdAsync(int id, int ownerUserId) =>
        await _context.Tenants.Include(t => t.Property).Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == id && t.Property.PropertyOwner!.UserId == ownerUserId);

    public async Task<Tenant?> GetTenantByIdAsync(int id) =>
        await _context.Tenants.Include(t => t.Property).Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Tenant?> GetTenantByMobileNumberAsync(string mobileNumber) =>
        await _context.Tenants.FirstOrDefaultAsync(t => t.MobileNumber == mobileNumber);

    public async Task<bool> MobileNumberExistsAsync(string mobileNumber) =>
        await _context.Tenants.AnyAsync(t => t.MobileNumber == mobileNumber);

    public async Task<SmartProperty.Api.Entities.Property.Unit?> GetUnitForOwnerAsync(
        int unitId, int propertyId, int ownerUserId) =>
        await _context.Units.Include(u => u.Property).ThenInclude(p => p!.PropertyOwner)
            .FirstOrDefaultAsync(u => u.Id == unitId && u.PropertyId == propertyId &&
                !u.IsArchived && !u.IsDeleted &&
                !u.Property!.IsArchived &&
                u.Property.PropertyOwner!.UserId == ownerUserId);

    public async Task<(List<Tenant> Items, int TotalCount)> GetTenantsAsync(
        int ownerUserId, string? search, bool? isActive, int? propertyId, int? unitId,
        string sortBy, bool descending, int page, int pageSize)
    {
        var query = _context.Tenants.Include(t => t.Property).Include(t => t.Unit)
            .Where(t => t.Property.PropertyOwner!.UserId == ownerUserId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t => t.FullName.ToLower().Contains(term) ||
                t.MobileNumber.Contains(term) ||
                (t.Email != null && t.Email.ToLower().Contains(term)));
        }

        if (isActive.HasValue) query = query.Where(t => t.IsActive == isActive.Value);
        if (propertyId.HasValue) query = query.Where(t => t.PropertyId == propertyId.Value);
        if (unitId.HasValue) query = query.Where(t => t.UnitId == unitId.Value);

        query = sortBy == "FullName"
            ? (descending ? query.OrderByDescending(t => t.FullName) : query.OrderBy(t => t.FullName))
            : (descending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt));

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, totalCount);
    }

    public async Task<(List<Tenant> Items, int TotalCount)> GetTenantsAsync(
        string? search, bool? isActive, string sortBy, bool descending, int page, int pageSize)
    {
        var query = _context.Tenants.Include(t => t.Property).Include(t => t.Unit).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t => t.FullName.ToLower().Contains(term) ||
                t.MobileNumber.Contains(term) ||
                (t.Email != null && t.Email.ToLower().Contains(term)));
        }

        if (isActive.HasValue) query = query.Where(t => t.IsActive == isActive.Value);

        query = sortBy == "FullName"
            ? (descending ? query.OrderByDescending(t => t.FullName) : query.OrderBy(t => t.FullName))
            : (descending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt));

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, totalCount);
    }

    public async Task UpdateTenantAsync(Tenant tenant)
    {
        tenant.UpdatedAt = DateTime.UtcNow;
        _context.Tenants.Update(tenant);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasActiveTenancyForUnitAsync(int unitId) =>
        await _context.Tenancies.AnyAsync(t => t.UnitId == unitId && t.Status == TenancyStatus.Active);

    public async Task<Tenancy> AddTenancyAsync(Tenancy tenancy)
    {
        _context.Tenancies.Add(tenancy);
        await _context.SaveChangesAsync();
        return tenancy;
    }

    public async Task<Tenancy?> GetTenancyByIdAsync(int id) =>
        await _context.Tenancies.Include(t => t.Tenant).FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Tenancy?> GetActiveTenancyByUserIdAsync(int userId) =>
        await _context.Tenancies.Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Tenant!.UserId == userId && t.Status == TenancyStatus.Active);

    public async Task<List<Tenancy>> GetTenancyHistoryByUserIdAsync(int userId) =>
        await _context.Tenancies.Include(t => t.Tenant)
            .Where(t => t.Tenant!.UserId == userId)
            .OrderByDescending(t => t.StartDate).ToListAsync();

    public async Task<List<Tenancy>> GetTenanciesByTenantIdAsync(int tenantId) =>
        await _context.Tenancies.Include(t => t.Tenant)
            .Where(t => t.TenantId == tenantId)
            .OrderByDescending(t => t.StartDate).ToListAsync();

    public async Task UpdateTenancyAsync(Tenancy tenancy)
    {
        tenancy.UpdatedAt = DateTime.UtcNow;
        _context.Tenancies.Update(tenancy);
        await _context.SaveChangesAsync();
    }

    // ---- Activation PIN ----
    public async Task<TenantActivationPin> AddActivationPinAsync(TenantActivationPin pin)
    {
        _context.TenantActivationPins.Add(pin);
        await _context.SaveChangesAsync();
        return pin;
    }

    public async Task<TenantActivationPin?> GetLatestUnusedPinAsync(int tenantId)
    {
        return await _context.TenantActivationPins
            .Where(p => p.TenantId == tenantId && !p.IsUsed)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateActivationPinAsync(TenantActivationPin pin)
    {
        _context.TenantActivationPins.Update(pin);
        await _context.SaveChangesAsync();
    }

    // ---- Shared User creation ----
    public async Task<User> AddUserAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<int> GetRoleIdByNameAsync(string roleName)
    {
        var role = await _context.Roles.FirstAsync(r => r.Name == roleName);
        return role.Id;
    }
}
