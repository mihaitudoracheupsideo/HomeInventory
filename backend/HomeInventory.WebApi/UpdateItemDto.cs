using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace HomeInventory.WebApi;

public class UpdateItemDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public Guid ItemTypeId { get; set; }

    [ValidateNever]
    public List<string>? Tags { get; set; }

    [ValidateNever]
    [JsonPropertyName("imagePath")]
    public string? ImagePath { get; set; }
}