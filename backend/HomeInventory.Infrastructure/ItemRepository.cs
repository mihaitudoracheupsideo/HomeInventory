using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class ItemRepository : Repository<Item>, IItemRepository
{
    public ItemRepository(AppDbContext context) : base(context)
    {
    }

    private async Task LoadFullParentChainAsync(Item item)
    {
        var current = item.Parent;
        while (current != null && current.ParentItemId != null)
        {
            await _context.Entry(current).Reference(i => i.Parent).LoadAsync();
            current = current.Parent;
        }
    }

    public async Task<IEnumerable<Item>> GetChangesSinceAsync(DateTime? since = null)
    {
        var query = _context.Item
            .IgnoreQueryFilters()
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .AsQueryable();

        if (since.HasValue)
        {
            query = query.Where(item => item.UpdatedAt > since.Value);
        }

        var items = await query
            .OrderBy(item => item.UpdatedAt)
            .ToListAsync();

        foreach (var item in items.Where(item => !item.Deleted && item.Parent != null))
        {
            await LoadFullParentChainAsync(item);
        }

        return items;
    }

    public async Task<IEnumerable<Item>> GetItemsWithDependenciesAsync(string? search = null)
    {
        var query = _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .Include(i => i.ItemTags)
                .ThenInclude(it => it.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Search in Name, Description, Tags (through ItemTags), and ItemType.Name
            query = query.Where(i =>
                EF.Functions.Like(i.Name, $"%{search}%") ||
                (!string.IsNullOrEmpty(i.Description) && EF.Functions.Like(i.Description, $"%{search}%")) ||
                (i.ItemTags != null && i.ItemTags.Any(it => EF.Functions.Like(it.Tag.Name, $"%{search}%"))) ||
                (i.ItemType != null && EF.Functions.Like(i.ItemType.Name, $"%{search}%"))
            );
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Item>> AdvancedSearchAsync(
        string? query = null,
        Guid? parentItemId = null,
        Guid? itemTypeId = null,
        IEnumerable<string>? tags = null,
        bool requireAllTags = true,
        bool rootOnly = false,
        bool withImageOnly = false)
    {
        var itemQuery = _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .ThenInclude(parent => parent.Parent)
            .Include(i => i.ItemTags)
                .ThenInclude(it => it.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            itemQuery = itemQuery.Where(i =>
                EF.Functions.Like(i.Name, $"%{query}%") ||
                (!string.IsNullOrEmpty(i.Description) && EF.Functions.Like(i.Description, $"%{query}%")) ||
                (!string.IsNullOrEmpty(i.UniqueCode) && EF.Functions.Like(i.UniqueCode, $"%{query}%")) ||
                (i.ItemType != null && EF.Functions.Like(i.ItemType.Name, $"%{query}%"))
            );
        }

        if (parentItemId.HasValue)
        {
            itemQuery = itemQuery.Where(i => i.ParentItemId == parentItemId.Value);
        }

        if (itemTypeId.HasValue)
        {
            itemQuery = itemQuery.Where(i => i.ItemTypeId == itemTypeId.Value);
        }

        if (rootOnly)
        {
            itemQuery = itemQuery.Where(i => i.ParentItemId == null);
        }

        if (withImageOnly)
        {
            itemQuery = itemQuery.Where(i => !string.IsNullOrEmpty(i.ImagePath));
        }

        var normalizedTags = tags?
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim().ToLowerInvariant())
            .Distinct()
            .ToArray() ?? Array.Empty<string>();

        if (normalizedTags.Length > 0)
        {
            if (requireAllTags)
            {
                foreach (var tag in normalizedTags)
                {
                    var currentTag = tag;
                    itemQuery = itemQuery.Where(i =>
                        i.ItemTags.Any(it => it.Tag.Name.ToLower() == currentTag));
                }
            }
            else
            {
                itemQuery = itemQuery.Where(i =>
                    i.ItemTags.Any(it => normalizedTags.Contains(it.Tag.Name.ToLower())));
            }
        }

        return await itemQuery.ToListAsync();
    }

    public async Task<Item?> GetItemWithTypeAsync(Guid id)
    {
        var item = await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (item != null)
        {
            await LoadFullParentChainAsync(item);
        }
        return item;
    }

    public async Task<Item?> GetItemByUniqueCodeAsync(string uniqueCode)
    {
        var item = await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .FirstOrDefaultAsync(i => i.UniqueCode == uniqueCode);
        if (item != null)
        {
            await LoadFullParentChainAsync(item);
        }
        return item;
    }

    public async Task<IEnumerable<Item>> GetItemsWithParentsAsync(IEnumerable<Guid> itemIds)
    {
        return await _context.Item
            .Include(i => i.ItemType)
            .Include(i => i.Parent)
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync();
    }

    public async Task<int> GetChildrenCountAsync(Guid itemId)
    {
        return await _context.Item
            .CountAsync(i => i.ParentItemId == itemId);
    }

    public async Task<IEnumerable<Item>> GetSubtreeAsync(Guid parentId)
    {
        var parent = await _context.Item.FirstOrDefaultAsync(i => i.Id == parentId);
        if (parent == null) return new List<Item>();

        return await _context.Item
            .Include(i => i.ItemType)
            .Where(i => EF.Functions.Like(i.Path, $"{parent.Path}%"))
            .OrderBy(i => i.Path)
            .ToListAsync();
    }

    public async Task<IEnumerable<Item>> GetRootItemsAsync()
    {
        return await _context.Item
            .Include(i => i.ItemType)
            .Where(i => i.ParentItemId == null)
            .OrderBy(i => i.NodeIndex)
            .ToListAsync();
    }

    public async Task<IEnumerable<Item>> GetByParentAsync(Guid? parentId)
    {
        return await _context.Item
            .Include(i => i.ItemType)
            .Where(i => i.ParentItemId == parentId)
            .OrderBy(i => i.NodeIndex)
            .ToListAsync();
    }

    public override async Task AddAsync(Item item)
    {
        // Compute NodeIndex
        var maxNodeIndex = await _context.Item.MaxAsync(i => (int?)i.NodeIndex) ?? 0;
        item.NodeIndex = maxNodeIndex + 1;

        // Compute Path and Depth
        if (item.ParentItemId.HasValue)
        {
            var parent = await _context.Item.FirstOrDefaultAsync(i => i.Id == item.ParentItemId.Value);
            if (parent != null)
            {
                item.Path = $"{parent.Path}{item.NodeIndex}/";
                item.Depth = parent.Depth + 1;
            }
            else
            {
                item.Path = $"/{item.NodeIndex}/";
                item.Depth = 0;
            }
        }
        else
        {
            item.Path = $"/{item.NodeIndex}/";
            item.Depth = 0;
        }

        await base.AddAsync(item);
    }

    public override async Task UpdateAsync(Item item)
    {
        var existing = await _context.Item.AsNoTracking().FirstOrDefaultAsync(i => i.Id == item.Id);
        if (existing == null) throw new InvalidOperationException("Item not found");

        // If parent changed, recalculate path and depth for subtree
        if (existing.ParentItemId != item.ParentItemId)
        {
            await RecalculateSubtreePathAndDepthAsync(item);
        }

        await base.UpdateAsync(item);
    }

    private async Task RecalculateSubtreePathAndDepthAsync(Item item)
    {
        // Compute new path and depth for the item
        if (item.ParentItemId.HasValue)
        {
            var parent = await _context.Item.FirstOrDefaultAsync(i => i.Id == item.ParentItemId.Value);
            if (parent != null)
            {
                item.Path = $"{parent.Path}{item.NodeIndex}/";
                item.Depth = parent.Depth + 1;
            }
            else
            {
                item.Path = $"/{item.NodeIndex}/";
                item.Depth = 0;
            }
        }
        else
        {
            item.Path = $"/{item.NodeIndex}/";
            item.Depth = 0;
        }

        // Update descendants
        var descendants = await _context.Item
            .Where(i => EF.Functions.Like(i.Path, $"{item.Path}%"))
            .ToListAsync();

        foreach (var desc in descendants)
        {
            if (desc.Id != item.Id)
            {
                desc.Path = desc.Path.Replace(item.Path.TrimEnd('/'), item.Path);
                desc.Depth = item.Depth + (desc.Depth - item.Depth);
            }
        }
    }
}