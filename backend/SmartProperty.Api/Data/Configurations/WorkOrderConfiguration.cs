using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartProperty.Api.Entities.Worker;

namespace SmartProperty.Api.Data.Configurations;

public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> builder)
    {
        builder.HasKey(wo => wo.Id);

        builder.Property(wo => wo.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(wo => wo.Notes)
            .HasMaxLength(1000);

        builder.Property(wo => wo.CompletionNotes)
            .HasMaxLength(1000);

        builder.Property(wo => wo.CompletionEvidenceUrl)
            .HasMaxLength(1000);

        builder.HasOne(wo => wo.MaintenanceRequest)
            .WithMany()
            .HasForeignKey(wo => wo.MaintenanceRequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(wo => wo.Worker)
            .WithMany(w => w.WorkOrders)
            .HasForeignKey(wo => wo.WorkerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(wo => wo.WorkerId);
        builder.HasIndex(wo => wo.MaintenanceRequestId);
        builder.HasIndex(wo => wo.Status);
    }
}

