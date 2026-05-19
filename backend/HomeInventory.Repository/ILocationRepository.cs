using HomeInventory.Domain.Entities;

namespace HomeInventory.Repository
{
    public interface ILocationRepository : IRepository<Location>
    {
        Task<Location?> GetCurrentLocationForItemAsync(Guid itemId);
        Task<IEnumerable<Location>> GetLocationHistoryForItemAsync(Guid itemId);
        Task<IEnumerable<Item>> GetItemsInLocationAsync(Guid locationItemId);
        Task<bool> SetCurrentLocationAsync(Guid itemId, Guid? locationItemId);
    }
}