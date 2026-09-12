using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data.Configurations;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;

namespace SmartProperty.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<PropertyOwner> PropertyOwners => Set<PropertyOwner>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new TenantConfiguration());

        modelBuilder.Entity<PropertyOwner>().HasKey(x => x.Id);
        modelBuilder.Entity<PropertyOwner>().HasIndex(x => x.UserId).IsUnique();
        modelBuilder.Entity<PropertyOwner>()
            .HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<PropertyOwner>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Property>().HasKey(x => x.Id);
        modelBuilder.Entity<Property>().Property(x => x.Name).IsRequired().HasMaxLength(150);
        modelBuilder.Entity<Property>()
            .HasOne(x => x.PropertyOwner)
            .WithMany(x => x.Properties)
            .HasForeignKey(x => x.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Unit>().HasKey(x => x.Id);
        modelBuilder.Entity<Unit>().Property(x => x.Name).IsRequired().HasMaxLength(100);
        modelBuilder.Entity<Unit>()
            .HasOne(x => x.Property)
            .WithMany(x => x.Units)
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

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

        modelBuilder.Entity<Tenant>()
            .HasOne(x => x.Property)
            .WithMany()
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tenant>()
            .HasOne(x => x.Unit)
            .WithMany(x => x.Tenants)
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Common system roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin" },
            new Role { Id = 2, Name = "PropertyOwner" },
            new Role { Id = 3, Name = "Tenant" },
            new Role { Id = 4, Name = "MaintenanceWorker" }
        );
    }
}