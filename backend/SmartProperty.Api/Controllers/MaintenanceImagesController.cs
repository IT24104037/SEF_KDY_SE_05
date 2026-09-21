using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/maintenance-images")]
[Authorize(Roles = "Tenant")]
public class MaintenanceImagesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public MaintenanceImagesController(
        IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please select an image."
            });
        }

        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(file.ContentType))
        {
            return BadRequest(new
            {
                message =
                    "Only JPG, PNG and WEBP images are allowed."
            });
        }

        const long maxFileSize = 5 * 1024 * 1024;

        if (file.Length > maxFileSize)
        {
            return BadRequest(new
            {
                message = "Image must be 5 MB or smaller."
            });
        }

        var webRoot =
            _environment.WebRootPath ??
            Path.Combine(
                _environment.ContentRootPath,
                "wwwroot");

        var uploadFolder = Path.Combine(
            webRoot,
            "uploads",
            "maintenance");

        Directory.CreateDirectory(uploadFolder);

        var extension =
            Path.GetExtension(file.FileName)
                .ToLowerInvariant();

        var fileName =
            $"{Guid.NewGuid()}{extension}";

        var filePath =
            Path.Combine(uploadFolder, fileName);

        await using (var stream =
            new FileStream(
                filePath,
                FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl =
            $"{Request.Scheme}://{Request.Host}" +
            $"/uploads/maintenance/{fileName}";

        return Ok(new
        {
            imageUrl
        });
    }
}