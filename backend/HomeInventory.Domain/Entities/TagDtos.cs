using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities;

public class CreateTagDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }

    public TagType Type { get; set; } = TagType.Generic;

    [StringLength(7)] // Hex color like #FF0000
    public string? Color { get; set; }

    [StringLength(50)]
    public string? Icon { get; set; }
}

public class UpdateTagDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }

    public TagType Type { get; set; } = TagType.Generic;

    [StringLength(7)] // Hex color like #FF0000
    public string? Color { get; set; }

    [StringLength(50)]
    public string? Icon { get; set; }
}

public class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string NormalizedName { get; set; }
    public TagType Type { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}