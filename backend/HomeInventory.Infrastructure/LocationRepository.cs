using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure
{
    public class LocationRepository : Repository<Location>, ILocationRepository
    {
        public LocationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Location?> GetCurrentLocationForItemAsync(Guid itemId)
        {
            return await _context.Location
                .Where(location => location.ItemId == itemId && location.Current)
                .Include(location => location.LocationItem)
                .OrderByDescending(location => location.AddedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Location>> GetLocationHistoryForItemAsync(Guid itemId)
        {
            return await _context.Location
                .Where(location => location.ItemId == itemId)
                .Include(location => location.LocationItem)
                .OrderBy(location => location.AddedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Item>> GetItemsInLocationAsync(Guid locationItemId)
        {
            return await _context.Item
                .Where(i => i.ParentItemId == locationItemId)
                .ToListAsync();
        }

        public async Task<bool> SetCurrentLocationAsync(Guid itemId, Guid? locationItemId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var item = await _context.Item.FindAsync(itemId);
                if (item == null)
                {
                    return false;
                }

                if (locationItemId == itemId)
                {
                    return false;
                }

                if (locationItemId.HasValue)
                {
                    var locationExists = await _context.Item.AnyAsync(candidate => candidate.Id == locationItemId.Value);
                    if (!locationExists)
                    {
                        return false;
                    }
                }

                var activeLocation = await _context.Location
                    .Where(location => location.ItemId == itemId && location.Current)
                    .OrderByDescending(location => location.AddedAt)
                    .FirstOrDefaultAsync();

                if (activeLocation?.LocationItemId == locationItemId)
                {
                    return true;
                }

                if (activeLocation != null)
                {
                    activeLocation.Current = false;
                }

                item.ParentItemId = locationItemId;

                if (locationItemId.HasValue)
                {
                    await _context.Location.AddAsync(new Location
                    {
                        Id = Guid.NewGuid(),
                        ItemId = itemId,
                        LocationItemId = locationItemId.Value,
                        AddedAt = DateTime.UtcNow,
                        Current = true
                    });
                }

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