using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain;

public class Item
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

    public List<string> Tags { get; set; } = new List<string>();

    [StringLength(500)]
    public string ImagePath { get; set; }

    // Location tracking
    public Guid? CurrentLocationItemId { get; set; }
    public virtual Item CurrentLocationItem { get; set; }

    // Audit fields
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties for location history
    public virtual ICollection<LocationHistory> LocationHistory { get; set; } = new List<LocationHistory>();

    // Navigation properties for items stored in this item
    public virtual ICollection<Item> StoredItems { get; set; } = new List<Item>();
}
