using HomeInventory.Domain;

namespace HomeInventory.Repository;

public interface IItemRepository : IRepository<Item>
{
    Task<IEnumerable<Item>> GetItemsWithTypesAsync(string? search = null);
    Task<Item?> GetItemWithTypeAsync(Guid id);
    Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode);
    Task<IEnumerable<Item>> GetItemsWithCurrentLocationsAsync(IEnumerable<Guid> itemIds);
}