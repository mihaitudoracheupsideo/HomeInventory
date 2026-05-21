using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class TagRepository : Repository<Tag>, ITagRepository
{
    public TagRepository(AppDbContext context) : base(context)
    {
    }

    private IQueryable<TagUsageResult> BuildTagUsageQuery()
    {
        return _context.Tags
            .GroupJoin(
                _context.ItemTags,
                tag => tag.Id,
                itemTag => itemTag.TagId,
                (tag, itemTags) => new TagUsageResult
                {
                    Tag = tag,
                    UsageCount = itemTags.Count()
                });
    }

    public async Task<Tag?> GetByNormalizedNameAsync(string normalizedName)
    {
        return await _context.Tags
            .FirstOrDefaultAsync(t => t.NormalizedName == normalizedName);
    }

    public async Task<Tag?> GetByNormalizedNameIncludingDeletedAsync(string normalizedName)
    {
        return await _context.Tags
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(tag => tag.NormalizedName == normalizedName);
    }

    public async Task<IEnumerable<Tag>> GetChangesSinceAsync(DateTime? since = null)
    {
        var query = _context.Tags
            .IgnoreQueryFilters()
            .AsQueryable();

        if (since.HasValue)
        {
            query = query.Where(tag => tag.UpdatedAt > since.Value);
        }

        return await query
            .OrderBy(tag => tag.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Tag>> SearchAsync(string query, int maxResults = 10)
    {
        var normalizedQuery = query.ToUpperInvariant();
        return await _context.Tags
            .Where(t => t.NormalizedName.Contains(normalizedQuery))
            .OrderBy(t => t.Name)
            .Take(maxResults)
            .ToListAsync();
    }

    public async Task<IEnumerable<TagUsageResult>> GetAllWithUsageAsync()
    {
        return await BuildTagUsageQuery()
            .OrderBy(result => result.Tag.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<TagUsageResult>> SearchWithUsageAsync(string query, int maxResults = 10)
    {
        var normalizedQuery = query.ToUpperInvariant().Trim();
        return await BuildTagUsageQuery()
            .Where(result => string.IsNullOrEmpty(normalizedQuery) ||
                result.Tag.NormalizedName.Contains(normalizedQuery))
            .OrderBy(result => result.Tag.Name)
            .Take(maxResults)
            .ToListAsync();
    }

    public async Task<int> GetUsageCountAsync(Guid tagId)
    {
        return await _context.ItemTags.CountAsync(itemTag => itemTag.TagId == tagId);
    }

    public async Task<bool> ExistsByNormalizedNameAsync(string normalizedName)
    {
        return await _context.Tags
            .AnyAsync(t => t.NormalizedName == normalizedName);
    }
}