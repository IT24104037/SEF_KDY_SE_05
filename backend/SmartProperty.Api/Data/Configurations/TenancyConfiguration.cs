using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Data.Configurations;

public class TenancyConfiguration : IEntityTypeConfiguration<Tenancy>
{
    public void Configure(EntityTypeBuilder<Tenancy> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Status)
            .HasConversion<string>() // stores "Active"/"Ended" as readable text
            .IsRequired();

        builder.Property(t => t.StartDate).IsRequired();

        // No FK constraint on UnitId yet — Unit table doesn't exist. This
        // index still speeds up the active-tenancy conflict-check query.
        builder.HasIndex(t => new { t.UnitId, t.Status });

        builder.HasOne(t => t.Tenant)
            .WithMany(tn => tn.Tenancies)
            .HasForeignKey(t => t.TenantId)
            .OnDelete(DeleteBehavior.Restrict); // never cascade-delete history
    }
}