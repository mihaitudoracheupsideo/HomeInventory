using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class TagRepository : Repository<Tag>, ITagRepository
{
    public TagRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Tag?> GetByNormalizedNameAsync(string normalizedName)
    {
        return await _context.Tags
            .FirstOrDefaultAsync(t => t.NormalizedName == normalizedName);
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

    public async Task<bool> ExistsByNormalizedNameAsync(string normalizedName)
    {
        return await _context.Tags
            .AnyAsync(t => t.NormalizedName == normalizedName);
    }
}