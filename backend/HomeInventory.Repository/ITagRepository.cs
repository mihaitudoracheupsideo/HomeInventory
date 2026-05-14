using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository;

public interface ITagRepository : IRepository<Tag>
{
    Task<Tag?> GetByNormalizedNameAsync(string normalizedName);
    Task<IEnumerable<Tag>> SearchAsync(string query, int maxResults = 10);
    Task<bool> ExistsByNormalizedNameAsync(string normalizedName);
}