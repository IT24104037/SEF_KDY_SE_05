using SmartProperty.Api.Common;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Interfaces;
using SmartProperty.Api.Repositories.Interfaces;

namespace SmartProperty.Api.Services;

public class TenancyService : ITenancyService
{
    private readonly ITenancyRepository _repository;

    public TenancyService(ITenancyRepository repository)
    {
        _repository = repository;
    }

    public async Task<TenantResponseDto> CreateTenantAsync(CreateTenantDto dto, int ownerUserId)
    {
        var mobileNumber = dto.MobileNumber.Trim();

        var unit = await _repository.GetUnitForOwnerAsync(dto.UnitId, dto.PropertyId, ownerUserId);
        if (unit == null)
        {
            throw new InvalidOperationException("The selected property or unit is not managed by this owner.");
        }

        // Business rule: mobile number must be unique across all tenants —
        // it's the identifier used later for PIN activation and login.
        var exists = await _repository.MobileNumberExistsAsync(mobileNumber);
        if (exists)
        {
            throw new InvalidOperationException(
                "A tenant with this mobile number already exists.");
        }

        var tenant = new Tenant
        {
            FullName = dto.FullName.Trim(),
            MobileNumber = mobileNumber,
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            PropertyId = dto.PropertyId,
            UnitId = dto.UnitId,
            IsActive = false, // stays false until the Activation PIN module marks it true
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repository.AddTenantAsync(tenant);
        var createdWithDetails = await _repository.GetTenantByIdAsync(created.Id, ownerUserId);
        return ToResponseDto(createdWithDetails!);
    }

    public async Task<PagedResult<TenantResponseDto>> GetTenantsAsync(TenantQueryParameters query, int ownerUserId)
    {
        var (items, totalCount) = await _repository.GetTenantsAsync(
            ownerUserId,
            query.Search,
            query.IsActive,
            query.PropertyId,
            query.UnitId,
            query.SortBy,
            query.Descending,
            query.Page,
            query.PageSize);

        return new PagedResult<TenantResponseDto>
        {
            Items = items.Select(ToResponseDto).ToList(),
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<TenantResponseDto?> GetTenantByIdAsync(int id, int ownerUserId)
    {
        var tenant = await _repository.GetTenantByIdAsync(id, ownerUserId);
        return tenant == null ? null : ToResponseDto(tenant);
    }

    public async Task<TenantResponseDto?> UpdateTenantAsync(int id, UpdateTenantDto dto, int ownerUserId)
    {
        var tenant = await _repository.GetTenantByIdAsync(id, ownerUserId);
        if (tenant == null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            tenant.FullName = dto.FullName.Trim();
        }

        if (dto.Email != null)
        {
            tenant.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        }

        await _repository.UpdateTenantAsync(tenant);
        return ToResponseDto(tenant);
    }

    public async Task<TenancyResponseDto> CreateTenancyAsync(CreateTenancyDto dto, int ownerUserId)
    {
        var tenant = await _repository.GetTenantByIdAsync(dto.TenantId, ownerUserId);
        if (tenant == null || tenant.UnitId != dto.UnitId ||
            tenant.Property.IsArchived || tenant.Unit.IsArchived || tenant.Unit.IsDeleted ||
            tenant.Unit.PropertyId != tenant.PropertyId)
        {
            throw new InvalidOperationException("The selected property or unit is not available for tenancy.");
        }

        if (await _repository.HasActiveTenancyForUnitAsync(dto.UnitId))
        {
            throw new InvalidOperationException("The unit already has an active tenancy.");
        }

        var tenancy = new Tenancy
        {
            TenantId = dto.TenantId,
            UnitId = dto.UnitId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = dto.EndDate.HasValue ? TenancyStatus.Ended : TenancyStatus.Active
        };

        var created = await _repository.AddTenancyAsync(tenancy);
        return ToTenancyResponseDto((await _repository.GetTenancyByIdAsync(created.Id))!);
    }

    public async Task<TenancyResponseDto?> GetCurrentTenancyAsync(int currentUserId) =>
        ToTenancyResponseDto(await _repository.GetActiveTenancyByUserIdAsync(currentUserId));

    public async Task<List<TenancyResponseDto>> GetTenancyHistoryAsync(int currentUserId) =>
        (await _repository.GetTenancyHistoryByUserIdAsync(currentUserId)).Select(ToTenancyResponseDto).ToList();

    public async Task<bool> EndTenancyAsync(int tenancyId, EndTenancyDto dto)
    {
        var tenancy = await _repository.GetTenancyByIdAsync(tenancyId);
        if (tenancy == null) return false;
        if (tenancy.Status == TenancyStatus.Ended)
        {
            throw new InvalidOperationException("Tenancy is already ended.");
        }

        tenancy.EndDate = dto.EndDate ?? DateTime.UtcNow;
        tenancy.Status = TenancyStatus.Ended;
        await _repository.UpdateTenancyAsync(tenancy);
        return true;
    }

    private static TenancyResponseDto ToTenancyResponseDto(Tenancy? tenancy) => new()
    {
        Id = tenancy!.Id,
        TenantId = tenancy.TenantId,
        TenantFullName = tenancy.Tenant?.FullName ?? string.Empty,
        UnitId = tenancy.UnitId,
        StartDate = tenancy.StartDate,
        EndDate = tenancy.EndDate,
        Status = tenancy.Status,
        CreatedAt = tenancy.CreatedAt
    };

    private static TenantResponseDto ToResponseDto(Tenant tenant)
    {
        return new TenantResponseDto
        {
            Id = tenant.Id,
            UserId = tenant.UserId,
            FullName = tenant.FullName,
            MobileNumber = tenant.MobileNumber,
            Email = tenant.Email,
            PropertyId = tenant.PropertyId,
            PropertyName = tenant.Property.Name,
            UnitId = tenant.UnitId,
            UnitName = tenant.Unit.UnitLabel,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            UpdatedAt = tenant.UpdatedAt
        };
    }
}