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
        var baseQuery = _context.Workers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<WorkerVerificationStatus>(status, true, out var parsedStatus))
            {
                baseQuery = baseQuery.Where(w => w.VerificationStatus == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            baseQuery = baseQuery.Where(w =>
                (w.User != null && w.User.FullName.ToLower().Contains(s)) ||
                (w.User != null && w.User.Email != null && w.User.Email.ToLower().Contains(s)) ||
                (w.User != null && w.User.Mobile != null && w.User.Mobile.Contains(s)) ||
                w.Skills.Any(sk => sk.SkillName.ToLower().Contains(s)));
        }

        var total = await baseQuery.CountAsync();

        var workers = await baseQuery
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .AsSplitQuery()
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

    // -------------------------------------------------------------
    // API Phase 2: Profile, Skills, Service Area Management
    // -------------------------------------------------------------
    public async Task<WorkerResponseDto> UpdateMyProfileAsync(int userId, UpdateWorkerProfileDto dto)
    {
        var worker = await _context.Workers
            .Include(w => w.User)
            .Include(w => w.Skills)
            .Include(w => w.ServiceAreas)
            .Include(w => w.Documents)
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (worker == null)
        {
            throw new KeyNotFoundException("Worker profile not found for this account.");
        }

        if (dto.HourlyRate.HasValue && dto.HourlyRate < 0)
        {
            throw new ArgumentException("Hourly rate must be a positive number.");
        }

        worker.Bio = dto.Bio?.Trim();
        worker.HourlyRate = dto.HourlyRate;
        worker.IsAvailable = dto.IsAvailable;
        worker.UpdatedAt = DateTime.UtcNow;

        // Update Service Area if provided
        if (dto.ServiceArea != null)
        {
            var area = worker.ServiceAreas.FirstOrDefault();
            if (area == null)
            {
                worker.ServiceAreas.Add(new ServiceArea
                {
                    Worker = worker,
                    City = dto.ServiceArea.Trim(),
                    RadiusKm = 25.0,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                area.City = dto.ServiceArea.Trim();
            }
        }

        // Update Skills if provided
        if (dto.Skills != null)
        {
            _context.WorkerSkills.RemoveRange(worker.Skills);
            worker.Skills.Clear();

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

        await _context.SaveChangesAsync();

        return MapToDto(worker);
    }

    // -------------------------------------------------------------
    // API Phase 3: Availability & "Free Now" Management
    // -------------------------------------------------------------
    public async Task<AvailabilityResponseDto> GetMyAvailabilityAsync(int userId)
    {
        var worker = await _context.Workers
            .Include(w => w.Availabilities)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (worker == null)
        {
            throw new KeyNotFoundException("Worker profile not found for this account.");
        }

        bool isFree = await IsWorkerFreeNowAsync(worker.Id);

        return new AvailabilityResponseDto
        {
            Slots = worker.Availabilities
                .OrderBy(a => a.DayOfWeek)
                .ThenBy(a => a.StartTime)
                .Select(a => new AvailabilitySlotDto
                {
                    Id = a.Id,
                    DayOfWeek = a.DayOfWeek,
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    IsActive = a.IsActive
                }).ToList(),
            FreeNow = isFree
        };
    }

    public async Task<AvailabilityResponseDto> UpdateMyAvailabilityAsync(int userId, UpdateAvailabilityDto dto)
    {
        var worker = await _context.Workers
            .Include(w => w.Availabilities)
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (worker == null)
        {
            throw new KeyNotFoundException("Worker profile not found for this account.");
        }

        // Validation Rule 1: EndTime must be strictly after StartTime for every slot
        foreach (var slot in dto.Slots)
        {
            if (slot.EndTime <= slot.StartTime)
            {
                throw new ArgumentException($"Shift end time ({slot.EndTime}) must be after start time ({slot.StartTime}) for {slot.DayOfWeek}.");
            }
        }

        // Validation Rule 2: Overlapping slots on the same day must be rejected
        var groupedByDay = dto.Slots.GroupBy(s => s.DayOfWeek);
        foreach (var group in groupedByDay)
        {
            var sortedSlots = group.OrderBy(s => s.StartTime).ToList();
            for (int i = 0; i < sortedSlots.Count - 1; i++)
            {
                if (sortedSlots[i].EndTime > sortedSlots[i + 1].StartTime)
                {
                    throw new ArgumentException($"Overlapping availability slots detected on {group.Key} ({sortedSlots[i].StartTime:hh\\:mm} - {sortedSlots[i].EndTime:hh\\:mm} overlaps with {sortedSlots[i + 1].StartTime:hh\\:mm} - {sortedSlots[i + 1].EndTime:hh\\:mm}).");
                }
            }
        }

        // Replace slots
        _context.WorkerAvailabilities.RemoveRange(worker.Availabilities);
        worker.Availabilities.Clear();

        foreach (var slot in dto.Slots)
        {
            worker.Availabilities.Add(new WorkerAvailability
            {
                Worker = worker,
                DayOfWeek = slot.DayOfWeek,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                IsActive = slot.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        worker.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        bool isFree = await IsWorkerFreeNowAsync(worker.Id);

        return new AvailabilityResponseDto
        {
            Slots = worker.Availabilities
                .OrderBy(a => a.DayOfWeek)
                .ThenBy(a => a.StartTime)
                .Select(a => new AvailabilitySlotDto
                {
                    Id = a.Id,
                    DayOfWeek = a.DayOfWeek,
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    IsActive = a.IsActive
                }).ToList(),
            FreeNow = isFree
        };
    }

    public async Task<bool> IsWorkerFreeNowAsync(int workerId)
    {
        var worker = await _context.Workers
            .Include(w => w.Availabilities)
            .Include(w => w.WorkOrders)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workerId);

        if (worker == null || !worker.IsAvailable || worker.VerificationStatus != WorkerVerificationStatus.Verified)
        {
            return false;
        }

        // Check if there is an ongoing/conflicting active work order right now
        bool hasActiveJob = worker.WorkOrders.Any(wo =>
            wo.Status == WorkOrderStatus.InProgress ||
            (wo.Status == WorkOrderStatus.Assigned && wo.ScheduledDate.HasValue &&
             Math.Abs((wo.ScheduledDate.Value - DateTime.UtcNow).TotalHours) < 2));

        if (hasActiveJob)
        {
            return false;
        }

        // Check current day and time slot
        var now = DateTime.UtcNow;
        var currentDay = now.DayOfWeek;
        var currentTime = now.TimeOfDay;

        bool hasMatchingSlot = worker.Availabilities.Any(a =>
            a.IsActive &&
            a.DayOfWeek == currentDay &&
            a.StartTime <= currentTime &&
            a.EndTime >= currentTime);

        return hasMatchingSlot;
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
