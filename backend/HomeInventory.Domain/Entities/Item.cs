using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities;

public class Item : ISyncEntity
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }

    [StringLength(500)]
    public string Description { get; set; }

    public Guid ItemTypeId { get; set; }
    public ItemType ItemType { get; set; }

    [StringLength(8, MinimumLength = 8)]
    public string UniqueCode { get; set; } = "";

    [StringLength(500)]
    public string ImagePath { get; set; }

    // Navigation properties for tags
    public virtual ICollection<ItemTag> ItemTags { get; set; } = new List<ItemTag>();

    // Hierarchy fields
    public Guid? ParentItemId { get; set; }
    public virtual Item Parent { get; set; }

    public int NodeIndex { get; set; }
    [StringLength(500)]
    public string Path { get; set; }
    public int Depth { get; set; }

    // Audit fields
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool Deleted { get; set; }

    // Navigation properties for location history
    public virtual ICollection<LocationHistory> LocationHistory { get; set; } = new List<LocationHistory>();

    // Navigation properties for child items
    public virtual ICollection<Item> Children { get; set; } = new List<Item>();
}
