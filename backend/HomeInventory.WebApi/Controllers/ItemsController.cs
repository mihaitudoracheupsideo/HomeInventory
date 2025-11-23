using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.WebApi;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly IItemRepository _itemRepository;
    private readonly IItemTypeRepository _itemTypeRepository;
    private readonly IMemoryCache _cache;

    public ItemsController(IItemRepository itemRepository, IItemTypeRepository itemTypeRepository, IMemoryCache cache)
    {
        _itemRepository = itemRepository;
        _itemTypeRepository = itemTypeRepository;
        _cache = cache;
    }

    // GET: api/items
    [HttpGet]
    public async Task<IActionResult> GetItems(int page = 1, int pageSize = 10, string? search = null)
    {
        // Don't cache search results since they are dynamic
        if (!string.IsNullOrEmpty(search))
        {
            var searchItems = await _itemRepository.GetItemsWithDependenciesAsync(search);
            var searchPaginated = searchItems.Skip((page - 1) * pageSize).Take(pageSize);
            var searchResult = await Task.WhenAll(searchItems.Select(async item => new
            {
                item.Id,
                item.Name,
                item.Description,
                item.UniqueCode,
                item.Tags,
                item.ImagePath,
                item.AddedAt,
                ItemTypeId = item.ItemTypeId,
                ItemType = item.ItemType != null ? new
                {
                    item.ItemType.Id,
                    item.ItemType.Name,
                    item.ItemType.Description
                } : null,
                CurrentLocationItemId = item.CurrentLocationItemId,
                currentLocationItem = item.CurrentLocationItem != null ? new
                {
                    item.CurrentLocationItem.Id,
                    item.CurrentLocationItem.Name,
                    item.CurrentLocationItem.Description,
                    item.CurrentLocationItem.UniqueCode
                } : null,
                StoredItemsCount = await _itemRepository.GetStoredItemsCountAsync(item.Id)
            }));
            return Ok(new PaginatedResponse<object> { Data = searchResult, TotalCount = searchItems.Count() });
        }
        
        // Cache only non-search results
        var cacheKey = "items_list_all";
        if (!_cache.TryGetValue(cacheKey, out IEnumerable<object>? items))
        {
            var allItems = await _itemRepository.GetItemsWithDependenciesAsync(null);
            var itemsWithLocation = await Task.WhenAll(allItems.Select(async item => new
            {
                item.Id,
                item.Name,
                item.Description,
                item.UniqueCode,
                item.Tags,
                item.ImagePath,
                item.AddedAt,
                ItemTypeId = item.ItemTypeId,
                ItemType = item.ItemType != null ? new
                {
                    item.ItemType.Id,
                    item.ItemType.Name,
                    item.ItemType.Description
                } : null,
                CurrentLocationItemId = item.CurrentLocationItemId,
                currentLocationItem = item.CurrentLocationItem != null ? new
                {
                    item.CurrentLocationItem.Id,
                    item.CurrentLocationItem.Name,
                    item.CurrentLocationItem.Description,
                    item.CurrentLocationItem.UniqueCode
                } : null,
                StoredItemsCount = await _itemRepository.GetStoredItemsCountAsync(item.Id)
            }));
            _cache.Set(cacheKey, itemsWithLocation, TimeSpan.FromMinutes(5));
            items = itemsWithLocation;
        }
        var paginated = items!.Skip((page - 1) * pageSize).Take(pageSize);
        return Ok(new PaginatedResponse<object> { Data = paginated, TotalCount = items!.Count() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _itemRepository.GetItemWithTypeAsync(id);
        if (item == null)
            return NotFound();

        return Ok(new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            item.Tags,
            item.ImagePath,
            item.AddedAt,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description
            } : null,
            CurrentLocationItemId = item.CurrentLocationItemId,
            currentLocationItem = BuildLocationItem(item.CurrentLocationItem)
        });
    }

    [HttpGet("code/{uniqueCode}")]
    public async Task<IActionResult> GetByUniqueCode(string uniqueCode)
    {
        var item = await _itemRepository.GetItemByUniqueCodeAsync(uniqueCode);
        if (item == null)
            return NotFound();
        
        return Ok(new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            item.Tags,
            item.ImagePath,
            item.AddedAt,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description
            } : null,
            CurrentLocationItemId = item.CurrentLocationItemId,
            currentLocationItem = BuildLocationItem(item.CurrentLocationItem)
        });
    }  

    // POST: api/Items/create
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateItemDto createItemDto)
    {
        Console.WriteLine("Create method called");
        
        if (createItemDto == null)
        {
            Console.WriteLine("Validation failed: CreateItemDto is null");
            return BadRequest("Item data is required");
        }
        
        Console.WriteLine($"Raw received data - Name: '{createItemDto.Name}', ItemTypeId: '{createItemDto.ItemTypeId}'");
        
        // Validate required fields
        if (string.IsNullOrWhiteSpace(createItemDto.Name))
        {
            Console.WriteLine("Validation failed: Name is empty");
            return BadRequest("Name is required");
        }
        
        // Check model state
        if (!ModelState.IsValid)
        {
            Console.WriteLine("Model state is invalid");
            foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
            {
                Console.WriteLine($"Model error: {error.ErrorMessage}");
            }
            return BadRequest(ModelState);
        }
        
        var item = new Item
        {
            Id = Guid.NewGuid(),
            Name = createItemDto.Name,
            Description = createItemDto.Description,
            ItemTypeId = createItemDto.ItemTypeId,
            Tags = createItemDto.Tags ?? new List<string>(),
            ImagePath = createItemDto.ImagePath,
            CurrentLocationItemId = createItemDto.CurrentLocationItemId,
            AddedAt = DateTime.UtcNow,
        };
        
        // Generate unique code
        item.UniqueCode = GenerateUniqueCode();
        
        Console.WriteLine($"Generated UniqueCode: {item.UniqueCode}");
        
        await _itemRepository.AddAsync(item);
        // Clear all item-related cache entries
        ClearItemCache();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    // PUT: api/Items/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateItemDto updateItemDto)
    {
        var existingItem = await _itemRepository.GetByIdAsync(id);
        if (existingItem == null)
            return NotFound();

        // Validate that the ItemType exists
        var itemType = await _itemTypeRepository.GetByIdAsync(updateItemDto.ItemTypeId);
        if (itemType == null)
            return BadRequest("Invalid ItemTypeId. The specified item type does not exist.");

        // Update only the fields that can be changed
        existingItem.Name = updateItemDto.Name;
        existingItem.Description = updateItemDto.Description;
        existingItem.ItemTypeId = updateItemDto.ItemTypeId;
        existingItem.Tags = updateItemDto.Tags ?? new List<string>();
        existingItem.ImagePath = updateItemDto.ImagePath;
        existingItem.CurrentLocationItemId = updateItemDto.CurrentLocationItemId;

        await _itemRepository.UpdateAsync(existingItem);
        // Clear all item-related cache entries
        ClearItemCache();
        return NoContent();
    }

    // DELETE: api/Items/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _itemRepository.GetByIdAsync(id);
        if (item == null)
            return NotFound();

        await _itemRepository.DeleteAsync(item);
        // Clear all item-related cache entries
        ClearItemCache();
        return NoContent();
    }

    private string GenerateUniqueCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var result = new char[8];
        
        for (int i = 0; i < 8; i++)
        {
            result[i] = chars[random.Next(chars.Length)];
        }
        
        return new string(result);
    }

    private void ClearItemCache()
    {
        // Since IMemoryCache doesn't provide a way to clear by pattern,
        // and we have dynamic cache keys for search results,
        // we'll need to implement a different approach.
        
        // For now, we'll create a simple cache clearing mechanism
        // by clearing the main cache entry. In a real application,
        // you might want to use a distributed cache or implement
        // a cache key registry.
        
        _cache.Remove("items_list_all");
        
        // Note: Search cache entries with dynamic keys cannot be easily cleared
        // with IMemoryCache. Consider using IDistributedCache with Redis
        // for more advanced cache management in production.
    }

    private object? BuildLocationItem(Item? item)
    {
        if (item == null) return null;
        return new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            currentLocationItem = BuildLocationItem(item.CurrentLocationItem)
        };
    }
}