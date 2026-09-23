using Microsoft.AspNetCore.Identity;
using SmartProperty.Api.Common;
using SmartProperty.Api.DTOs.Tenancies;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Interfaces;
using SmartProperty.Api.Repositories.Interfaces;

namespace SmartProperty.Api.Services;

public class TenancyService : ITenancyService
{
    private readonly ITenancyRepository _repository;
    private readonly IActivationPinGenerator _pinGenerator;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public TenancyService(ITenancyRepository repository, IActivationPinGenerator pinGenerator)
    {
        _repository = repository;
        _pinGenerator = pinGenerator;
    }
    
    
    public async Task<CreateTenantResponseDto> CreateTenantAsync(CreateTenantDto dto, int ownerUserId)
    {
        var mobileNumber = dto.MobileNumber.Trim();
        var unit = await _repository.GetUnitForOwnerAsync(dto.UnitId, dto.PropertyId, ownerUserId);
        if (unit == null)
        {
            throw new InvalidOperationException("The selected property or unit is not managed by this owner.");
        }

        if (await _repository.MobileNumberExistsAsync(mobileNumber))
        {
            throw new InvalidOperationException("A tenant with this mobile number already exists.");
        }

        var tenant = new Tenant
        {
            FullName = dto.FullName.Trim(),
            MobileNumber = mobileNumber,
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            PropertyId = dto.PropertyId,
            UnitId = dto.UnitId,
            IsActive = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repository.AddTenantAsync(tenant);
        var pin = _pinGenerator.GeneratePin();
        var pinExpiresAt = DateTime.UtcNow.AddHours(24);
        await _repository.AddActivationPinAsync(new TenantActivationPin
        {
            TenantId = created.Id,
            PinHash = pin.pinHash,
            ExpiresAt = pinExpiresAt
        });

        var createdWithDetails = await _repository.GetTenantByIdAsync(created.Id, ownerUserId);
        var response = ToResponseDto(createdWithDetails!);
        return new CreateTenantResponseDto
        {
            Id = response.Id,
            UserId = response.UserId,
            FullName = response.FullName,
            MobileNumber = response.MobileNumber,
            Email = response.Email,
            PropertyId = response.PropertyId,
            PropertyName = response.PropertyName,
            UnitId = response.UnitId,
            UnitName = response.UnitName,
            IsActive = response.IsActive,
            CreatedAt = response.CreatedAt,
            UpdatedAt = response.UpdatedAt,
            ActivationPin = pin.rawPin,
            PinExpiresAt = pinExpiresAt
        };
    }

    public async Task<PagedResult<TenantResponseDto>> GetTenantsAsync(TenantQueryParameters query, int ownerUserId)
    {
        var (items, totalCount) = await _repository.GetTenantsAsync(
            ownerUserId, query.Search, query.IsActive, query.PropertyId, query.UnitId,
            query.SortBy, query.Descending, query.Page, query.PageSize);

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
        if (tenant == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.FullName)) tenant.FullName = dto.FullName.Trim();
        if (dto.Email != null) tenant.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        await _repository.UpdateTenantAsync(tenant);
        return ToResponseDto(tenant);
    }

    public async Task<TenancyResponseDto> CreateTenancyAsync(
    CreateTenancyDto dto,
    int ownerUserId)
{
    var tenant = await _repository.GetTenantByIdAsync(
        dto.TenantId,
        ownerUserId);

    if (tenant == null)
    {
        throw new InvalidOperationException(
            "Tenant was not found or does not belong to this owner.");
    }

    // Use the unit already assigned to this tenant.
    if (tenant.UnitId != dto.UnitId)
    {
        throw new InvalidOperationException(
            "The selected unit does not match the tenant's assigned unit.");
    }

    if (tenant.Property == null || tenant.Unit == null)
    {
        throw new InvalidOperationException(
            "The tenant's property or unit details could not be loaded.");
    }

    if (tenant.Property.IsArchived)
    {
        throw new InvalidOperationException(
            "The tenant's property is archived.");
    }

    if (tenant.Property.VerificationStatus !=
        Entities.Property.PropertyVerificationStatus.Approved)
    {
        throw new InvalidOperationException(
            "The property must be approved before creating a tenancy.");
    }

    if (tenant.Unit.IsArchived || tenant.Unit.IsDeleted)
    {
        throw new InvalidOperationException(
            "The tenant's assigned unit is unavailable.");
    }

    if (tenant.Unit.PropertyId != tenant.PropertyId)
    {
        throw new InvalidOperationException(
            "The assigned unit does not belong to the tenant's property.");
    }

    // Prevent duplicate/current tenancy for this tenant.
    var tenantTenancies =
        await _repository.GetTenanciesByTenantIdAsync(
            tenant.Id);

    var existingActiveTenancy =
        tenantTenancies.FirstOrDefault(x =>
            x.Status == TenancyStatus.Active &&
            x.EndDate == null);

    if (existingActiveTenancy != null)
    {
        throw new InvalidOperationException(
            "This tenant already has an active tenancy.");
    }

    // Prevent two tenants occupying the same unit.
    if (await _repository.HasActiveTenancyForUnitAsync(
        tenant.UnitId))
    {
        throw new InvalidOperationException(
            "The assigned unit already has an active tenancy.");
    }

    var startDateUtc = dto.StartDate.Kind switch
    {
    DateTimeKind.Utc => dto.StartDate,
    DateTimeKind.Local => dto.StartDate.ToUniversalTime(),
    _ => DateTime.SpecifyKind(
        dto.StartDate,
        DateTimeKind.Utc)
    };

    DateTime? endDateUtc = dto.EndDate.HasValue
        ? dto.EndDate.Value.Kind switch
        {
            DateTimeKind.Utc =>
                dto.EndDate.Value,

            DateTimeKind.Local =>
                dto.EndDate.Value.ToUniversalTime(),

            _ =>
                DateTime.SpecifyKind(
                    dto.EndDate.Value,
                    DateTimeKind.Utc)
        }
        : null;

    if (endDateUtc.HasValue &&
        endDateUtc.Value <= startDateUtc)
    {
        throw new InvalidOperationException(
            "End date must be after the start date.");
    }

    var tenancy = new Tenancy
    {
        TenantId = tenant.Id,
        UnitId = tenant.UnitId,

        StartDate = startDateUtc,
        EndDate = endDateUtc,

        Status = (endDateUtc.HasValue && endDateUtc.Value <= DateTime.UtcNow)
            ? TenancyStatus.Ended
            : TenancyStatus.Active,

        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var created =
        await _repository.AddTenancyAsync(tenancy);

    var createdWithDetails =
        await _repository.GetTenancyByIdAsync(created.Id);

    if (createdWithDetails == null)
    {
        throw new InvalidOperationException(
            "Tenancy was created but could not be loaded.");
    }

    return ToTenancyResponseDto(createdWithDetails);
}

       public async Task<List<TenancyResponseDto>?> GetTenanciesForTenantAsync(int tenantId, int ownerUserId)
    {
        var tenant = await _repository.GetTenantByIdAsync(tenantId, ownerUserId);
        if (tenant == null) return null;

        var tenancies = await _repository.GetTenanciesByTenantIdAsync(tenantId);
        return tenancies.Select(ToTenancyResponseDto).ToList();
    }

    public async Task<TenancyResponseDto?> GetCurrentTenancyAsync(int currentUserId)
    {
        var tenancy = await _repository.GetActiveTenancyByUserIdAsync(currentUserId);
        return tenancy == null ? null : ToTenancyResponseDto(tenancy);
    }

    public async Task<List<TenancyResponseDto>> GetTenancyHistoryAsync(int currentUserId) =>
        (await _repository.GetTenancyHistoryByUserIdAsync(currentUserId)).Select(ToTenancyResponseDto).ToList();

    public async Task<bool> EndTenancyAsync(int tenancyId, EndTenancyDto dto)
    {
        var tenancy = await _repository.GetTenancyByIdAsync(tenancyId);
        if (tenancy == null) return false;
        if (tenancy.Status == TenancyStatus.Ended) throw new InvalidOperationException("Tenancy is already ended.");

        tenancy.EndDate = dto.EndDate ?? DateTime.UtcNow;
        tenancy.Status = TenancyStatus.Ended;
        await _repository.UpdateTenancyAsync(tenancy);
        return true;
    }

    public async Task<ActivationResultDto> ActivateTenantAsync(ActivateTenantDto dto)
    {
        var tenant = await _repository.GetTenantByMobileNumberAsync(dto.MobileNumber.Trim());
        if (tenant == null) return Failure("Invalid mobile number or PIN.");

        var pin = await _repository.GetLatestUnusedPinAsync(tenant.Id);
        if (pin == null || pin.ExpiresAt <= DateTime.UtcNow || !_pinGenerator.VerifyPin(dto.Pin, pin.PinHash))
        {
            return Failure("Invalid mobile number or PIN.");
        }

        var roleId = await _repository.GetRoleIdByNameAsync("Tenant");
        var user = new User
        {
            FullName = tenant.FullName,
            Mobile = tenant.MobileNumber,
            Email = tenant.Email,
            PasswordHash = _passwordHasher.HashPassword(null!, dto.Password),
            RoleId = roleId,
            IsActive = true
        };

        var createdUser = await _repository.AddUserAsync(user);
        tenant.UserId = createdUser.Id;
        tenant.IsActive = true;
        pin.IsUsed = true;
        await _repository.UpdateTenantAsync(tenant);
        await _repository.UpdateActivationPinAsync(pin);
        return new ActivationResultDto { Success = true, Message = "Tenant account activated successfully." };
    }

    private static ActivationResultDto Failure(string message) => new() { Success = false, Message = message };

    private static TenancyResponseDto ToTenancyResponseDto(Tenancy? tenancy) => new()
    {
        Id = tenancy!.Id,
        TenantId = tenancy.TenantId,
        TenantFullName = tenancy.Tenant?.FullName ?? string.Empty,
        UnitId = tenancy.UnitId,
        UnitName = tenancy.Tenant?.Unit?.UnitLabel ?? string.Empty,
        StartDate = tenancy.StartDate,
        EndDate = tenancy.EndDate,
        Status = tenancy.Status,
        CreatedAt = tenancy.CreatedAt
    };

    private static TenantResponseDto ToResponseDto(Tenant tenant) => new()
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
