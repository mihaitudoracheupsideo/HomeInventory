using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository;

public interface ITagRepository : IRepository<Tag>
{
    Task<IEnumerable<Tag>> GetChangesSinceAsync(DateTime? since = null);
    Task<Tag?> GetByNormalizedNameAsync(string normalizedName);
    Task<Tag?> GetByNormalizedNameIncludingDeletedAsync(string normalizedName);
    Task<IEnumerable<Tag>> SearchAsync(string query, int maxResults = 10);
    Task<IEnumerable<TagUsageResult>> GetAllWithUsageAsync();
    Task<IEnumerable<TagUsageResult>> SearchWithUsageAsync(string query, int maxResults = 10);
    Task<int> GetUsageCountAsync(Guid tagId);
    Task<bool> ExistsByNormalizedNameAsync(string normalizedName);
}