using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using System.IO;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ImagesController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage(
        IFormFile file,
        [FromForm] string uniqueCode,
        [FromForm] int? maxWidth = null,
        [FromForm] int? maxHeight = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var imageSettings = _configuration.GetSection("ImageSettings");
        var rootPath = imageSettings["RootPath"];
        var maxFileSize = int.Parse(imageSettings["MaxFileSize"] ?? "10485760");
        var allowedExtensions = imageSettings.GetSection("AllowedExtensions").Get<string[]>() ?? new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        // Validate file size
        if (file.Length > maxFileSize)
            return BadRequest($"File size exceeds maximum allowed size of {maxFileSize} bytes");

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest($"File type {extension} is not allowed. Allowed types: {string.Join(", ", allowedExtensions)}");

        // Create directory structure based on unique code
        var directoryPath = Path.Combine(Directory.GetCurrentDirectory(), rootPath, uniqueCode);
        Directory.CreateDirectory(directoryPath);

        // Generate filename using unique code
        var fileName = $"{uniqueCode}{extension}";
        var filePath = Path.Combine(directoryPath, fileName);

        // Process image if resizing is requested
        if (maxWidth.HasValue || maxHeight.HasValue)
        {
            using var image = await Image.LoadAsync(file.OpenReadStream());

            // Calculate new dimensions maintaining aspect ratio
            var newWidth = maxWidth ?? image.Width;
            var newHeight = maxHeight ?? image.Height;

            if (maxWidth.HasValue && maxHeight.HasValue)
            {
                // Fit within both dimensions
                var ratioX = (double)maxWidth.Value / image.Width;
                var ratioY = (double)maxHeight.Value / image.Height;
                var ratio = Math.Min(ratioX, ratioY);

                newWidth = (int)(image.Width * ratio);
                newHeight = (int)(image.Height * ratio);
            }
            else if (maxWidth.HasValue)
            {
                // Scale by width
                var ratio = (double)maxWidth.Value / image.Width;
                newWidth = maxWidth.Value;
                newHeight = (int)(image.Height * ratio);
            }
            else if (maxHeight.HasValue)
            {
                // Scale by height
                var ratio = (double)maxHeight.Value / image.Height;
                newHeight = maxHeight.Value;
                newWidth = (int)(image.Width * ratio);
            }

            image.Mutate(x => x.Resize(newWidth, newHeight));

            // Save processed image
            await image.SaveAsync(filePath, new JpegEncoder { Quality = 85 });
        }
        else
        {
            // Save original image
            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);
        }

        // Return relative path
        var relativePath = Path.Combine(uniqueCode, fileName).Replace("\\", "/");
        return Ok(new { imagePath = relativePath });
    }

    [HttpGet("{**imagePath}")]
    public IActionResult GetImage(string imagePath)
    {
        var imageSettings = _configuration.GetSection("ImageSettings");
        var rootPath = imageSettings["RootPath"];

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), rootPath, imagePath.Replace("/", "\\"));

        if (!System.IO.File.Exists(filePath))
            return NotFound();

        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        var contentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        return PhysicalFile(filePath, contentType);
    }
}