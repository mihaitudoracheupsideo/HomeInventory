using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities;
public class ItemType
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Name { get; set; }

    [StringLength(200)]
    public string Description { get; set; }

    [StringLength(100)]
    public string Icon { get; set; }

    public bool CanContainItems { get; set; }

    public bool IsLeaf { get; set; }

    [StringLength(7)] // #RRGGBB
    public string Color { get; set; }

    public int SortOrder { get; set; }

    //public ICollection<Item> Items { get; set; }
}