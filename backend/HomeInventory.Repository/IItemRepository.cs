using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository;

public interface IItemRepository : IRepository<Item>
{
    Task<IEnumerable<Item>> GetItemsWithDependenciesAsync(string? search = null);
    Task<Item?> GetItemWithTypeAsync(Guid id);
    Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode);
    Task<IEnumerable<Item>> GetItemsWithParentsAsync(IEnumerable<Guid> itemIds);
    Task<int> GetChildrenCountAsync(Guid itemId);
    Task<IEnumerable<Item>> GetSubtreeAsync(Guid parentId);
    Task<IEnumerable<Item>> GetRootItemsAsync();
    Task<IEnumerable<Item>> GetByParentAsync(Guid? parentId);
}