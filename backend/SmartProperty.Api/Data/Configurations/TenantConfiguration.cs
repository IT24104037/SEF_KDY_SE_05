using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.FullName).IsRequired().HasMaxLength(200);
        builder.Property(t => t.MobileNumber).IsRequired().HasMaxLength(30);
        builder.HasIndex(t => t.MobileNumber).IsUnique();

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Property)
            .WithMany()
            .HasForeignKey(t => t.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Unit)
            .WithMany(u => u.Tenants)
            .HasForeignKey(t => t.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
