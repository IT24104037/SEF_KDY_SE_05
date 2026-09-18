using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Data.Configurations;

public class TenantActivationPinConfiguration : IEntityTypeConfiguration<TenantActivationPin>
{
    public void Configure(EntityTypeBuilder<TenantActivationPin> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PinHash).IsRequired();
        builder.Property(p => p.ExpiresAt).IsRequired();

        // Speeds up "find the latest unused PIN for this tenant" lookups.
        builder.HasIndex(p => p.TenantId);

        builder.HasOne(p => p.Tenant)
            .WithMany(t => t.ActivationPins)
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}