using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;

namespace SmartProperty.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();

    public DbSet<PropertyOwner> PropertyOwners => Set<PropertyOwner>();
    public DbSet<OwnerVerificationDocument> OwnerVerificationDocuments => Set<OwnerVerificationDocument>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --------------------
        // Identity
        // --------------------

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

        // --------------------
        // Property Owner
        // --------------------

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

        // --------------------
        // Verification Documents
        // --------------------

        modelBuilder.Entity<OwnerVerificationDocument>()
            .HasOne(d => d.PropertyOwner)
            .WithMany(po => po.VerificationDocuments)
            .HasForeignKey(d => d.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // --------------------
        // Property
        // --------------------

        modelBuilder.Entity<Property>()
            .HasOne(p => p.PropertyOwner)
            .WithMany(po => po.Properties)
            .HasForeignKey(p => p.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // --------------------
        // Unit
        // --------------------

        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Property)
            .WithMany(p => p.Units)
            .HasForeignKey(u => u.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unit labels must be unique within a property.
        modelBuilder.Entity<Unit>()
            .HasIndex(u => new { u.PropertyId, u.UnitLabel })
            .IsUnique();
    }
}