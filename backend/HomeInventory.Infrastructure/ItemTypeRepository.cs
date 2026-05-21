using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemTypeRepository : Repository<ItemType>, IItemTypeRepository
{
    public ItemTypeRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ItemType>> GetChangesSinceAsync(DateTime? since = null)
    {
        var query = _context.ItemType
            .IgnoreQueryFilters()
            .AsQueryable();

        if (since.HasValue)
        {
            query = query.Where(itemType => itemType.UpdatedAt > since.Value);
        }

        return await query
            .OrderBy(itemType => itemType.UpdatedAt)
            .ToListAsync();
    }
}