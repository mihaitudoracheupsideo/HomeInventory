using HomeInventory.Domain.Entities;
using HomeInventory.Repository;

namespace HomeInventory.Infrastructure;

public class ItemTypeRepository : Repository<ItemType>, IItemTypeRepository
{
    public ItemTypeRepository(AppDbContext context) : base(context)
    {
    }
}