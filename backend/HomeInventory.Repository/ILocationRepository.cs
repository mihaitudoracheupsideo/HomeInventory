using HomeInventory.Domain;

namespace HomeInventory.Repository
{
    public interface ILocationRepository : IRepository<LocationHistory>
    {
        Task<LocationHistory?> GetCurrentLocationForItemAsync(Guid itemId);
        Task<IEnumerable<LocationHistory>> GetLocationHistoryForItemAsync(Guid itemId);
        Task<IEnumerable<Item>> GetItemsInLocationAsync(Guid locationItemId);
        Task<bool> SetCurrentLocationAsync(Guid itemId, Guid locationItemId);
    }
}