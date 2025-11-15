using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemRepository : Repository<Item>, IItemRepository
{
    public ItemRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Item>> GetItemsWithTypesAsync()
    {
        return await _context.Item.Include(i => i.ItemType).ToListAsync();
    }

    public async Task<Item?> GetItemWithTypeAsync(Guid id)
    {
        return await _context.Item.Include(i => i.ItemType).FirstOrDefaultAsync(i => i.Id == id);
    }
}