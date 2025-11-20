using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain;

public class CreateItemDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; }
    
    [StringLength(500)]
    public string Description { get; set; }
    
    [Required]
    public Guid ItemTypeId { get; set; }
    
    public List<string> Tags { get; set; } = new List<string>();
    
    [StringLength(500)]
    public string ImagePath { get; set; }
}