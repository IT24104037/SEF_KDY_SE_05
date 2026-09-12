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
            UnitName = tenant.Unit.Name,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            UpdatedAt = tenant.UpdatedAt
        };
    }
}