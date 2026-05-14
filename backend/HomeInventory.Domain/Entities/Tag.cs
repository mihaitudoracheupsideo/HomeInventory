using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities;

public enum TagType
{
    Generic = 0,
    Category = 1,
    Brand = 2,
    Location = 3,
    Feature = 4,
    Status = 5,
    Collection = 6
}

public class Tag
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }

    [Required]
    [StringLength(100)]
    public string NormalizedName { get; set; }

    public TagType Type { get; set; } = TagType.Generic;

    [StringLength(7)] // Hex color like #FF0000
    public string? Color { get; set; }

    [StringLength(50)]
    public string? Icon { get; set; }

    // Navigation properties
    public virtual ICollection<ItemTag> ItemTags { get; set; } = new List<ItemTag>();
}