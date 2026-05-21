using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository;

public interface IItemTypeRepository : IRepository<ItemType>
{
	Task<IEnumerable<ItemType>> GetChangesSinceAsync(DateTime? since = null);
}