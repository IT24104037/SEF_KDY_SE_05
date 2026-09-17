using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Workers;
using SmartProperty.Api.Entities.Identity;
using SmartProperty.Api.Entities.Worker;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

public class WorkerService : IWorkerService
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;

    public WorkerService(AppDbContext context, IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<WorkerResponseDto> RegisterWorkerAsync(RegisterWorkerDto dto)
    {
        var email = dto.Email.Trim().ToLower();
        var mobile = dto.Mobile.Trim();

        // 1. Check duplicate email or mobile across users
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u =>
                (u.Email != null && u.Email.ToLower() == email) ||
                (u.Mobile != null && u.Mobile == mobile));

        if (existingUser != null)
        {
            throw new InvalidOperationException("A user with this email or mobile number already exists.");
        }

        // 2. Fetch MaintenanceWorker role
        var workerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "MaintenanceWorker");

        if (workerRole == null)
        {
            throw new InvalidOperationException("MaintenanceWorker role is not configured in the system.");
        }

        // 3. Create User record
        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Mobile = mobile,
            RoleId = workerRole.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        _context.Users.Add(user);

        // 4. Create Worker profile
        var worker = new Worker
        {
            User = user,
            VerificationStatus = WorkerVerificationStatus.PendingVerification,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Workers.Add(worker);

        // 5. Add skills
        if (dto.Skills != null && dto.Skills.Count > 0)
        {
            foreach (var skillName in dto.Skills.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var skillTrimmed = skillName.Trim();
                if (!string.IsNullOrEmpty(skillTrimmed))
                {
                    var matchingCategory = await _context.MaintenanceCategories
                        .FirstOrDefaultAsync(c => c.Name.ToLower() == skillTrimmed.ToLower());

                    worker.Skills.Add(new WorkerSkill
                    {
                        Worker = worker,
                        SkillName = skillTrimmed,
                        CategoryId = matchingCategory?.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        // 6. Add Service Area
        if (!string.IsNullOrWhiteSpace(dto.ServiceArea))
        {
            worker.ServiceAreas.Add(new ServiceArea
            {
                Worker = worker,
                City = dto.ServiceArea.Trim(),
                RadiusKm = 25.0,
                CreatedAt = DateTime.UtcNow
            });
        }

        // 7. Add Proof Document
        if (!string.IsNullOrWhiteSpace(dto.ProofDocumentName))
        {
            worker.Documents.Add(new WorkerDocument
            {
                Worker = worker,
                DocumentType = "TradeLicense",
                DocumentUrl = string.IsNullOrWhiteSpace(dto.ProofDocumentUrl)
                    ? $"/uploads/workers/{Guid.NewGuid()}_{dto.ProofDocumentName.Trim()}"
                    : dto.ProofDocumentUrl.Trim(),
                OriginalFileName = dto.ProofDocumentName.Trim(),
                UploadedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return MapToDto(worker);
    }

    public async Task<WorkerListResponseDto> GetWorkersAsync(string? search = null, string? status = null, int page = 1, int pageSize = 50)
    {
        var query = _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<WorkerVerificationStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(w => w.VerificationStatus == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(w =>
                (w.User != null && w.User.FullName.ToLower().Contains(s)) ||
                (w.User != null && w.User.Email != null && w.User.Email.ToLower().Contains(s)) ||
                (w.User != null && w.User.Mobile != null && w.User.Mobile.Contains(s)) ||
                w.Skills.Any(sk => sk.SkillName.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();

        var workers = await query
            .OrderByDescending(w => w.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new WorkerListResponseDto
        {
            Workers = workers.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<WorkerResponseDto?> GetWorkerByIdAsync(int id)
    {
        var worker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id);

        return worker == null ? null : MapToDto(worker);
    }

    public async Task<WorkerResponseDto?> GetWorkerByUserIdAsync(int userId)
    {
        var worker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId);

        return worker == null ? null : MapToDto(worker);
    }

    public async Task<WorkerResponseDto> VerifyWorkerAsync(int workerId, VerifyWorkerDto dto, int adminUserId)
    {
        if (!Enum.TryParse<WorkerVerificationStatus>(dto.Decision, true, out var newStatus))
        {
            throw new ArgumentException("Decision must be either 'Verified' or 'Rejected'.");
        }

        if (newStatus == WorkerVerificationStatus.PendingVerification)
        {
            throw new ArgumentException("Cannot set worker back to 'PendingVerification'.");
        }

        if (newStatus == WorkerVerificationStatus.Rejected && string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            throw new ArgumentException("A rejection reason is required when rejecting a worker.");
        }

        var worker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .FirstOrDefaultAsync(w => w.Id == workerId);

        if (worker == null)
        {
            throw new KeyNotFoundException($"Worker with ID {workerId} was not found.");
        }

        worker.VerificationStatus = newStatus;
        worker.VerifiedByAdminId = adminUserId;
        worker.UpdatedAt = DateTime.UtcNow;

        if (newStatus == WorkerVerificationStatus.Verified)
        {
            worker.VerifiedAt = DateTime.UtcNow;
            worker.RejectionReason = null;
        }
        else
        {
            worker.VerifiedAt = null;
            worker.RejectionReason = dto.RejectionReason?.Trim();
        }

        await _context.SaveChangesAsync();

        return MapToDto(worker);
    }

    private static WorkerResponseDto MapToDto(Worker worker)
    {
        var doc = worker.Documents.OrderByDescending(d => d.UploadedAt).FirstOrDefault();
        var area = worker.ServiceAreas.FirstOrDefault();

        return new WorkerResponseDto
        {
            Id = worker.Id,
            UserId = worker.UserId,
            FullName = worker.User?.FullName ?? string.Empty,
            Email = worker.User?.Email ?? string.Empty,
            Mobile = worker.User?.Mobile ?? string.Empty,
            VerificationStatus = worker.VerificationStatus.ToString(),
            RejectionReason = worker.RejectionReason,
            Bio = worker.Bio,
            HourlyRate = worker.HourlyRate,
            IsAvailable = worker.IsAvailable,
            Skills = worker.Skills.Select(s => s.SkillName).ToList(),
            ServiceArea = area?.City ?? string.Empty,
            ProofDocumentName = doc?.OriginalFileName ?? doc?.DocumentType ?? string.Empty,
            ProofDocumentUrl = doc?.DocumentUrl ?? string.Empty,
            VerifiedAt = worker.VerifiedAt,
            CreatedAt = worker.CreatedAt
        };
    }
}

