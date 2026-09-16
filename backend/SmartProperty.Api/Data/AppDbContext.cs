using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data.Configurations;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Entities.Maintenance;


namespace SmartProperty.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
    public DbSet<Tenancy> Tenancies => Set<Tenancy>();

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<PropertyOwner> PropertyOwners => Set<PropertyOwner>();
    public DbSet<OwnerVerificationDocument> OwnerVerificationDocuments => Set<OwnerVerificationDocument>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();

    public DbSet<MaintenanceCategory> MaintenanceCategories { get; set; }
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
    public DbSet<MaintenanceImage> MaintenanceImages { get; set; }
    public DbSet<MaintenanceStatusHistory> MaintenanceStatusHistories { get; set; }



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new TenantConfiguration());
        modelBuilder.ApplyConfiguration(new TenancyConfiguration());

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Mobile)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId);

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin" },
            new Role { Id = 2, Name = "PropertyOwner" },
            new Role { Id = 3, Name = "Tenant" },
            new Role { Id = 4, Name = "MaintenanceWorker" }
        );

        modelBuilder.Entity<PropertyOwner>()
            .HasOne(po => po.User)
            .WithMany()
            .HasForeignKey(po => po.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PropertyOwner>()
            .HasOne(po => po.VerifiedByAdmin)
            .WithMany()
            .HasForeignKey(po => po.VerifiedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OwnerVerificationDocument>()
            .HasOne(d => d.PropertyOwner)
            .WithMany(po => po.VerificationDocuments)
            .HasForeignKey(d => d.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Property>()
            .HasOne(p => p.PropertyOwner)
            .WithMany(po => po.Properties)
            .HasForeignKey(p => p.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Property)
            .WithMany(p => p.Units)
            .HasForeignKey(u => u.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Only non-deleted active unit labels must be unique within a property.
        modelBuilder.Entity<Unit>()
            .HasIndex(u => new { u.PropertyId, u.UnitLabel })
            .HasFilter("\"IsArchived\" = false AND \"IsDeleted\" = false")
            .IsUnique();

        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.Property)
            .WithMany()
            .HasForeignKey(t => t.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.Unit)
            .WithMany(u => u.Tenants)
            .HasForeignKey(t => t.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MaintenanceCategory>(entity =>
        {
            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Description)
                .HasMaxLength(500);

            entity.HasIndex(x => x.Name)
                .IsUnique();
        });

        modelBuilder.Entity<MaintenanceRequest>(entity =>
        {
            entity.Property(x => x.Description)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(x => x.RequestType)
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Priority)
                .HasMaxLength(30);

            entity.Property(x => x.EmergencyType)
                .HasMaxLength(100);

            entity.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Property)
                .WithMany()
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Unit)
                .WithMany()
                .HasForeignKey(x => x.UnitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MaintenanceImage>(entity =>
        {
            entity.Property(x => x.ImageUrl)
                .IsRequired()
                .HasMaxLength(1000);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MaintenanceStatusHistory>(entity =>
        {
            entity.Property(x => x.OldStatus)
                .HasMaxLength(50);

            entity.Property(x => x.NewStatus)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ChangedByUser)
                .WithMany()
                .HasForeignKey(x => x.ChangedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
