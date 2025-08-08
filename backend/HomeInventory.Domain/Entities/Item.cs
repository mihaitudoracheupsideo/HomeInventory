namespace HomeInventory.Domain;

public class Item
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public Guid ItemTypeId { get; set; }
    public ItemType ItemType { get; set; }
}
