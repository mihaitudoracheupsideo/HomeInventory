using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemRepository : Repository<Item>, IItemRepository
{
    public ItemRepository(AppDbContext context) : base(context)
    {
    }

    private async Task LoadFullLocationChainAsync(Item item)
    {
        var current = item.CurrentLocationItem;
        while (current != null && current.CurrentLocationItemId != null)
        {
            await _context.Entry(current).Reference(i => i.CurrentLocationItem).LoadAsync();
            current = current.CurrentLocationItem;
        }
    }

    public async Task<IEnumerable<Item>> GetItemsWithDependenciesAsync(string? search = null)
    {
        var query = _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.CurrentLocationItem)
            .AsQueryable();

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
        var item = await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.CurrentLocationItem)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (item != null)
        {
            await LoadFullLocationChainAsync(item);
        }
        return item;
    }

    public async Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode)
    {
        var item = await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.CurrentLocationItem)
            .FirstOrDefaultAsync(i => i.UniqueCode == uniqueCode);
        if (item != null)
        {
            await LoadFullLocationChainAsync(item);
        }
        return item;
    }

    public async Task<IEnumerable<Item>> GetItemsWithCurrentLocationsAsync(IEnumerable<Guid> itemIds)
    {
        return await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.CurrentLocationItem)
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync();
    }

    public async Task<int> GetStoredItemsCountAsync(Guid itemId)
    {
        return await _context.Item
            .CountAsync(i => i.CurrentLocationItemId == itemId);
    }
}