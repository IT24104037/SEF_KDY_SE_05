using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data.Configurations;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Entities.Tenancy;
using SmartProperty.Api.Entities.Maintenance;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Entities.AgenticAI;


namespace SmartProperty.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
    public DbSet<Tenancy> Tenancies => Set<Tenancy>();
    public DbSet<TenantActivationPin> TenantActivationPins => Set<TenantActivationPin>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<PropertyOwner> PropertyOwners => Set<PropertyOwner>();
    public DbSet<OwnerVerificationDocument> OwnerVerificationDocuments => Set<OwnerVerificationDocument>();
    public DbSet<OwnerProfileChangeRequest> OwnerProfileChangeRequests => Set<OwnerProfileChangeRequest>();
    public DbSet<PropertyVerificationDocument> PropertyVerificationDocuments => Set<PropertyVerificationDocument>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();

    public DbSet<MaintenanceCategory> MaintenanceCategories { get; set; }
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
    public DbSet<MaintenanceImage> MaintenanceImages { get; set; }
    public DbSet<MaintenanceStatusHistory> MaintenanceStatusHistories { get; set; }

    public DbSet<Worker> Workers => Set<Worker>();
    public DbSet<WorkerSkill> WorkerSkills => Set<WorkerSkill>();
    public DbSet<WorkerDocument> WorkerDocuments => Set<WorkerDocument>();
    public DbSet<WorkerAvailability> WorkerAvailabilities => Set<WorkerAvailability>();
    public DbSet<ServiceArea> ServiceAreas => Set<ServiceArea>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<ExternalMaintenanceArrangement> ExternalMaintenanceArrangements => Set<ExternalMaintenanceArrangement>();
    public DbSet<ValidationResult> ValidationResults => Set<ValidationResult>();
    public DbSet<ApprovalDecision> ApprovalDecisions => Set<ApprovalDecision>();
    public DbSet<AgentWorkflow> AgentWorkflows => Set<AgentWorkflow>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<ToolExecution> ToolExecutions => Set<ToolExecution>();
    public DbSet<AgentExecutionLog> AgentExecutionLogs => Set<AgentExecutionLog>();

public DbSet<MaintenanceAnalysisResult> MaintenanceAnalysisResults
{
    get;
    set;
}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new TenantConfiguration());
        modelBuilder.ApplyConfiguration(new TenancyConfiguration());
        modelBuilder.ApplyConfiguration(new TenantActivationPinConfiguration());

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

        modelBuilder.Entity<OwnerProfileChangeRequest>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.RequestedFullName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.RequestedEmail)
                .HasMaxLength(256);

            entity.Property(x => x.RequestedMobile)
                .HasMaxLength(20);

            entity.HasOne(x => x.PropertyOwner)
                .WithMany()
                .HasForeignKey(x => x.PropertyOwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ReviewedByAdmin)
                .WithMany()
                .HasForeignKey(x => x.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Property>()
            .HasOne(p => p.PropertyOwner)
            .WithMany(po => po.Properties)
            .HasForeignKey(p => p.PropertyOwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Property>()
            .HasOne(p => p.VerifiedByAdmin)
            .WithMany()
            .HasForeignKey(p => p.VerifiedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PropertyVerificationDocument>()
            .HasOne(d => d.Property)
            .WithMany(p => p.VerificationDocuments)
            .HasForeignKey(d => d.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

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

            entity.HasOne(x => x.Tenancy)
                .WithMany()
                .HasForeignKey(x => x.TenancyId)
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

        modelBuilder.ApplyConfiguration(new WorkerConfiguration());
        modelBuilder.ApplyConfiguration(new WorkOrderConfiguration());

        modelBuilder.Entity<WorkerSkill>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SkillName)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<WorkerDocument>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DocumentType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.DocumentUrl)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(x => x.OriginalFileName)
                .HasMaxLength(255);
        });

        modelBuilder.Entity<ServiceArea>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.City)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.PostalCode)
                .HasMaxLength(20);
        });

        modelBuilder.Entity<WorkerAvailability>(entity =>
        {
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ExternalMaintenanceArrangement>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProviderName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(x => x.ContactPhone)
                .HasMaxLength(50);

            entity.Property(x => x.ContactEmail)
                .HasMaxLength(100);

            entity.Property(x => x.EstimatedArrival)
                .HasMaxLength(100);

            entity.Property(x => x.EstimatedCost)
                .HasPrecision(18, 2);

            entity.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Note)
                .HasMaxLength(1000);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ValidationResult>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.Summary)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Worker)
                .WithMany()
                .HasForeignKey(x => x.WorkerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ApprovalDecision>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Decision)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.PropertyOwner)
                .WithMany()
                .HasForeignKey(x => x.PropertyOwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AgentWorkflow>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.CurrentStep)
                .HasMaxLength(100);

            entity.Property(x => x.ApprovalStatus)
                .HasMaxLength(50);

            entity.Property(x => x.FinalOutcome)
                .HasMaxLength(1000);

            entity.HasOne(x => x.MaintenanceRequest)
                .WithMany()
                .HasForeignKey(x => x.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkflowStep>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.StepName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.AgentName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.InputSummary)
                .HasMaxLength(2000);

            entity.Property(x => x.OutputSummary)
                .HasMaxLength(2000);

            entity.Property(x => x.ErrorSummary)
                .HasMaxLength(1000);

            entity.HasOne(x => x.AgentWorkflow)
                .WithMany(w => w.WorkflowSteps)
                .HasForeignKey(x => x.AgentWorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ToolExecution>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ToolName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.InputSummary)
                .HasMaxLength(2000);

            entity.Property(x => x.OutputSummary)
                .HasMaxLength(2000);

            entity.Property(x => x.ErrorSummary)
                .HasMaxLength(1000);

            entity.HasOne(x => x.AgentWorkflow)
                .WithMany(w => w.ToolExecutions)
                .HasForeignKey(x => x.AgentWorkflowId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.WorkflowStep)
                .WithMany(s => s.ToolExecutions)
                .HasForeignKey(x => x.WorkflowStepId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentExecutionLog>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.AgentName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.Summary)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(x => x.ErrorSummary)
                .HasMaxLength(1000);

            entity.HasOne(x => x.AgentWorkflow)
                .WithMany(w => w.ExecutionLogs)
                .HasForeignKey(x => x.AgentWorkflowId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.WorkflowStep)
                .WithMany(s => s.ExecutionLogs)
                .HasForeignKey(x => x.WorkflowStepId)
                .OnDelete(DeleteBehavior.Cascade);
        });



            modelBuilder.Entity<MaintenanceAnalysisResult>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasOne(x => x.MaintenanceRequest)
                    .WithOne()
                    .HasForeignKey<MaintenanceAnalysisResult>(
                        x => x.MaintenanceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(x => x.MaintenanceRequestId)
                    .IsUnique();
            });
    }
}

