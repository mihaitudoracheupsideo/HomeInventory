using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository;

public interface IItemTagRepository : IRepository<ItemTag>
{
    Task<IEnumerable<ItemTag>> GetItemTagsWithTagsAsync(Guid itemId);
}