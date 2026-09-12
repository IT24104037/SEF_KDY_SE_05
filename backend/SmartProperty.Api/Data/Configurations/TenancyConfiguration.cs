using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.MobileNumber)
            .IsRequired()
            .HasMaxLength(20);

        // Mobile number must be unique — it's used later for PIN activation
        // and login, so two tenants can never share one.
        builder.HasIndex(t => t.MobileNumber)
            .IsUnique();

        builder.Property(t => t.Email)
            .HasMaxLength(150);

        builder.HasIndex(t => new { t.PropertyId, t.UnitId });

        // Optional link to the shared User table. Restrict (not Cascade)
        // so deleting a User can never silently wipe out Tenant history.
        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}