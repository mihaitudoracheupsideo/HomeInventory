using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure
{
    public class LocationRepository : Repository<LocationHistory>, ILocationRepository
    {
        public LocationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<LocationHistory?> GetCurrentLocationForItemAsync(Guid itemId)
        {
            // Get the current location from the Item entity
            var item = await _context.Item
                .Where(i => i.Id == itemId)
                .Include(i => i.CurrentLocationItem)
                .FirstOrDefaultAsync();

            if (item?.CurrentLocationItemId == null)
                return null;

            // Return a LocationHistory-like object for compatibility
            return new LocationHistory
            {
                Id = Guid.NewGuid(), // Not stored, just for compatibility
                ItemId = itemId,
                LocationItemId = item.CurrentLocationItemId.Value,
                AddedAt = item.AddedAt,
                Item = item,
                LocationItem = item.CurrentLocationItem
            };
        }

        public async Task<IEnumerable<LocationHistory>> GetLocationHistoryForItemAsync(Guid itemId)
        {
            return await _context.LocationHistory
                .Where(lh => lh.ItemId == itemId)
                .Include(lh => lh.LocationItem)
                .OrderByDescending(lh => lh.AddedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Item>> GetItemsInLocationAsync(Guid locationItemId)
        {
            return await _context.Item
                .Where(i => i.CurrentLocationItemId == locationItemId)
                .ToListAsync();
        }

        public async Task<bool> SetCurrentLocationAsync(Guid itemId, Guid locationItemId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Get the current item
                var item = await _context.Item.FindAsync(itemId);
                if (item == null)
                    return false;

                // If the location is changing, add the old location to history
                if (item.CurrentLocationItemId.HasValue && item.CurrentLocationItemId != locationItemId)
                {
                    var historyEntry = new LocationHistory
                    {
                        Id = Guid.NewGuid(),
                        ItemId = itemId,
                        LocationItemId = item.CurrentLocationItemId.Value,
                        AddedAt = item.AddedAt
                    };

                    await _context.LocationHistory.AddAsync(historyEntry);
                }

                // Update the current location
                item.CurrentLocationItemId = locationItemId;
                item.AddedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }
    }
}