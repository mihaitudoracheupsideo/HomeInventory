using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemTagRepository : Repository<ItemTag>, IItemTagRepository
{
    public ItemTagRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ItemTag>> GetItemTagsWithTagsAsync(Guid itemId)
    {
        return await _context.ItemTags
            .Include(it => it.Tag)
            .Where(it => it.ItemId == itemId)
            .ToListAsync();
    }
}