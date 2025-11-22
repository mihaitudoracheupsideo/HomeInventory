using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemRepository : Repository<Item>, IItemRepository
{
    public ItemRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Item>> GetItemsWithTypesAsync(string? search = null)
    {
        var query = _context.Item.Include(i => i.ItemType).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Search in Name, Description, Tags (joined), and ItemType.Name
            query = query.Where(i =>
                EF.Functions.Like(i.Name, $"%{search}%") ||
                (!string.IsNullOrEmpty(i.Description) && EF.Functions.Like(i.Description, $"%{search}%")) ||
                (i.Tags != null && i.Tags.Any(tag => EF.Functions.Like(tag, $"%{search}%"))) ||
                (i.ItemType != null && EF.Functions.Like(i.ItemType.Name, $"%{search}%"))
            );
        }

        return await query.ToListAsync();
    }

    public async Task<Item?> GetItemWithTypeAsync(Guid id)
    {
        return await _context.Item.Include(i => i.ItemType).FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode)
    {
        return await _context.Item.Include(i => i.ItemType).FirstOrDefaultAsync(i => i.UniqueCode == uniqueCode);
    }

    public async Task<IEnumerable<Item>> GetItemsWithCurrentLocationsAsync(IEnumerable<Guid> itemIds)
    {
        return await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.CurrentLocationItem)
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync();
    }
}