using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Worker;

namespace SmartProperty.Api.Data.Configurations;

public class WorkerConfiguration : IEntityTypeConfiguration<Worker>
{
    public void Configure(EntityTypeBuilder<Worker> builder)
    {
        builder.HasKey(w => w.Id);

        builder.HasIndex(w => w.UserId).IsUnique();

        builder.Property(w => w.VerificationStatus)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(w => w.RejectionReason)
            .HasMaxLength(500);

        builder.Property(w => w.Bio)
            .HasMaxLength(1000);

        builder.Property(w => w.HourlyRate)
            .HasPrecision(18, 2);

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.VerifiedByAdmin)
            .WithMany()
            .HasForeignKey(w => w.VerifiedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(w => w.Skills)
            .WithOne(s => s.Worker)
            .HasForeignKey(s => s.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Documents)
            .WithOne(d => d.Worker)
            .HasForeignKey(d => d.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Availabilities)
            .WithOne(a => a.Worker)
            .HasForeignKey(a => a.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.ServiceAreas)
            .WithOne(sa => sa.Worker)
            .HasForeignKey(sa => sa.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.WorkOrders)
            .WithOne(wo => wo.Worker)
            .HasForeignKey(wo => wo.WorkerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

