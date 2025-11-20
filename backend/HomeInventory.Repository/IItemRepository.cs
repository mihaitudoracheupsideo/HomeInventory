using HomeInventory.Domain;

namespace HomeInventory.Repository;

public interface IItemRepository : IRepository<Item>
{
    Task<IEnumerable<Item>> GetItemsWithTypesAsync();
    Task<Item?> GetItemWithTypeAsync(Guid id);
    Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode);
}