using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartProperty.Api.Controllers;

[ApiController]
[Route("api/maintenance-images")]
[Authorize(Roles = "Tenant")]
public class MaintenanceImagesController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public MaintenanceImagesController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        CancellationToken cancellationToken)
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
                message = "Only JPG, PNG and WEBP images are allowed."
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

        var supabaseUrl =
            _configuration["Supabase:Url"];

        var secretKey =
            _configuration["Supabase:SecretKey"];

        var bucket =
            _configuration["Supabase:MaintenanceBucket"];

        if (string.IsNullOrWhiteSpace(supabaseUrl))
        {
            return StatusCode(500, new
            {
                message = "Supabase URL is not configured."
            });
        }

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            return StatusCode(500, new
            {
                message = "Supabase secret key is not configured."
            });
        }

        if (string.IsNullOrWhiteSpace(bucket))
        {
            return StatusCode(500, new
            {
                message = "Supabase maintenance bucket is not configured."
            });
        }

        supabaseUrl = supabaseUrl.TrimEnd('/');

        var extension = file.ContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };

        var fileName =
            $"{Guid.NewGuid():N}{extension}";

        var objectPath =
            $"maintenance/{DateTime.UtcNow:yyyy/MM}/{fileName}";

        var uploadUrl =
            $"{supabaseUrl}/storage/v1/object/{bucket}/{objectPath}";

        var client =
            _httpClientFactory.CreateClient();

        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                uploadUrl);

        // sb_secret_ keys must be sent as API keys,
        // not as Authorization Bearer JWTs.
        request.Headers.TryAddWithoutValidation(
            "apikey",
            secretKey);

        request.Headers.TryAddWithoutValidation(
            "x-upsert",
            "false");

        await using var stream =
            file.OpenReadStream();

        using var content =
            new StreamContent(stream);

        content.Headers.ContentType =
            new MediaTypeHeaderValue(
                file.ContentType);

        request.Content = content;

        var response =
            await client.SendAsync(
                request,
                cancellationToken);

        var responseBody =
            await response.Content.ReadAsStringAsync(
                cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode(502, new
            {
                message =
                    "Failed to upload image to Supabase Storage.",
                details = responseBody
            });
        }

        var imageUrl =
            $"{supabaseUrl}/storage/v1/object/public/" +
            $"{bucket}/{objectPath}";

        return Ok(new
        {
            imageUrl,
            objectPath
        });
    }
}