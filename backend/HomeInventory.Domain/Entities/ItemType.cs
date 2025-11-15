using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain;
public class ItemType
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Name { get; set; }

    [StringLength(200)]
    public string Description { get; set; }

    //public ICollection<Item> Items { get; set; }
}