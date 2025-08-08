namespace HomeInventory.Domain;
public class ItemType
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public ICollection<Item> Items { get; set; }
}