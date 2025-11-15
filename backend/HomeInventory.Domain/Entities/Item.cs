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
}
