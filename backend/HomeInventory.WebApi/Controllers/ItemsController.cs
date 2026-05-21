using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using HomeInventory.Application;
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
    private readonly ILocationRepository _locationRepository;
    private readonly ITagService _tagService;
    private readonly IMemoryCache _cache;

    public ItemsController(
        IItemRepository itemRepository,
        IItemTypeRepository itemTypeRepository,
        ILocationRepository locationRepository,
        ITagService tagService,
        IMemoryCache cache)
    {
        _itemRepository = itemRepository;
        _itemTypeRepository = itemTypeRepository;
        _locationRepository = locationRepository;
        _tagService = tagService;
        _cache = cache;
    }

    // GET: api/items
    [HttpGet]
    public async Task<IActionResult> GetItems(int page = 1, int pageSize = 10, string? search = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 1000);

        // Don't cache search results since they are dynamic
        if (!string.IsNullOrEmpty(search))
        {
            var searchItems = await _itemRepository.GetItemsWithDependenciesAsync(search);
            var searchItemsList = searchItems.ToList();
            var searchPaginated = searchItemsList.Skip((page - 1) * pageSize).Take(pageSize);
            var searchResult = await ProjectItemsAsync(searchPaginated);
            return Ok(new PaginatedResponse<object> { Data = searchResult, TotalCount = searchItemsList.Count });
        }
        
        // Cache only non-search results
        var cacheKey = "items_list_all";
        if (!_cache.TryGetValue(cacheKey, out IEnumerable<object>? items))
        {
            var allItems = await _itemRepository.GetItemsWithDependenciesAsync(null);
            var itemsWithLocation = await ProjectItemsAsync(allItems);
            _cache.Set(cacheKey, itemsWithLocation, TimeSpan.FromMinutes(5));
            items = itemsWithLocation;
        }
        var paginated = items!.Skip((page - 1) * pageSize).Take(pageSize);
        return Ok(new PaginatedResponse<object> { Data = paginated, TotalCount = items!.Count() });
    }

    [HttpGet("sync")]
    public async Task<IActionResult> Sync([FromQuery] DateTime? since = null)
    {
        var items = await _itemRepository.GetChangesSinceAsync(since);
        var projectedItems = await Task.WhenAll(items.Select(ProjectSyncItemAsync));

        return Ok(new SyncResponse<object>
        {
            Data = projectedItems,
            SyncTimestamp = DateTime.UtcNow,
        });
    }

    [HttpGet("advanced-search")]
    public async Task<IActionResult> AdvancedSearch(
        [FromQuery] string? query = null,
        [FromQuery] Guid? parentItemId = null,
        [FromQuery] Guid? itemTypeId = null,
        [FromQuery(Name = "tag")] string[]? tags = null,
        [FromQuery] string tagMatchMode = "all",
        [FromQuery] bool rootOnly = false,
        [FromQuery] bool withImageOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 1000);

        var requireAllTags = !string.Equals(tagMatchMode, "any", StringComparison.OrdinalIgnoreCase);
        var matchedItems = await _itemRepository.AdvancedSearchAsync(
            query,
            parentItemId,
            itemTypeId,
            tags,
            requireAllTags,
            rootOnly,
            withImageOnly);

        var matchedItemsList = matchedItems.ToList();
        var paginatedItems = matchedItemsList.Skip((page - 1) * pageSize).Take(pageSize);
        var projectedItems = await ProjectItemsAsync(paginatedItems);

        return Ok(new PaginatedResponse<object>
        {
            Data = projectedItems,
            TotalCount = matchedItemsList.Count
        });
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
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.Deleted,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.Color,
                item.ItemType.UpdatedAt,
                item.ItemType.Deleted,
            } : null,
            ParentItemId = item.ParentItemId,
            parent = BuildLocationItem(item.Parent)
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
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.Deleted,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.Color,
                item.ItemType.UpdatedAt,
                item.ItemType.Deleted,
            } : null,
            ParentItemId = item.ParentItemId,
            parent = BuildLocationItem(item.Parent)
        });
    }

    // GET: api/items/tree
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var rootItems = await _itemRepository.GetRootItemsAsync();
        var tree = new List<object>();

        foreach (var root in rootItems)
        {
            tree.Add(await BuildTreeNodeAsync(root));
        }

        return Ok(tree);
    }

    // GET: api/items/{id}/children
    [HttpGet("{id}/children")]
    public async Task<IActionResult> GetChildren(Guid id)
    {
        var children = await _itemRepository.GetByParentAsync(id);
        var result = await Task.WhenAll(children.Select(async child => new
        {
            child.Id,
            child.Name,
            child.Description,
            child.UniqueCode,
            Tags = await GetItemTagNamesAsync(child.Id),
            child.ImagePath,
            child.AddedAt,
            child.UpdatedAt,
            child.NodeIndex,
            child.Path,
            child.Depth,
            ItemTypeId = child.ItemTypeId,
            ItemType = child.ItemType != null ? new
            {
                child.ItemType.Id,
                child.ItemType.Name,
                    child.ItemType.Description,
                    child.ItemType.Icon,
                    child.ItemType.CanContainItems,
                    child.ItemType.IsLeaf,
                    child.ItemType.Color,
                    child.ItemType.SortOrder
                } : null,
                ChildrenCount = await _itemRepository.GetChildrenCountAsync(child.Id)
            }));
        return Ok(result);
    }

    // GET: api/items/{id}/subtree
    [HttpGet("{id}/subtree")]
    public async Task<IActionResult> GetSubtree(Guid id)
    {
        var subtree = await _itemRepository.GetSubtreeAsync(id);
        var result = await Task.WhenAll(subtree.Select(async item => new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.NodeIndex,
            item.Path,
            item.Depth,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.Icon,
                item.ItemType.CanContainItems,
                item.ItemType.IsLeaf,
                item.ItemType.Color,
                item.ItemType.SortOrder
            } : null
        }));
        return Ok(result);
    }

    // GET: api/items/{id}/breadcrumbs
    [HttpGet("{id}/breadcrumbs")]
    public async Task<IActionResult> GetBreadcrumbs(Guid id)
    {
        var item = await _itemRepository.GetItemWithTypeAsync(id);
        if (item == null) return NotFound();

        var breadcrumbs = new List<object>();
        var current = item;

        while (current != null)
        {
            breadcrumbs.Insert(0, new
            {
                current.Id,
                current.Name,
                current.UniqueCode,
                current.Depth
            });

            current = current.Parent;
        }

        return Ok(breadcrumbs);
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
            ImagePath = createItemDto.ImagePath,
            ParentItemId = null,
            AddedAt = DateTime.UtcNow,
        };
        
        // Generate unique code
        item.UniqueCode = GenerateUniqueCode();
        
        Console.WriteLine($"Generated UniqueCode: {item.UniqueCode}");
        
        await _itemRepository.AddAsync(item);

        if (createItemDto.ParentItemId.HasValue)
        {
            var locationCreated = await _locationRepository.SetCurrentLocationAsync(item.Id, createItemDto.ParentItemId);
            if (!locationCreated)
            {
                return BadRequest("Failed to set initial location.");
            }
        }
        
        // Assign tags if provided
        if (createItemDto.Tags != null && createItemDto.Tags.Any())
        {
            await _tagService.AssignTagsToItemAsync(item.Id, createItemDto.Tags);
        }

        var createdItem = await _itemRepository.GetItemWithTypeAsync(item.Id);
        if (createdItem == null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Created item could not be reloaded.");
        }
        
        // Clear all item-related cache entries
        ClearItemCache();
        return CreatedAtAction(
            nameof(GetById),
            new { id = createdItem.Id },
            await ProjectItemAsync(createdItem));
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
        var locationChanged = existingItem.ParentItemId != updateItemDto.ParentItemId;

        existingItem.Name = updateItemDto.Name;
        existingItem.Description = updateItemDto.Description;
        existingItem.ItemTypeId = updateItemDto.ItemTypeId;
        existingItem.ImagePath = updateItemDto.ImagePath;

        if (locationChanged)
        {
            var updated = await _locationRepository.SetCurrentLocationAsync(existingItem.Id, updateItemDto.ParentItemId);
            if (!updated)
            {
                return BadRequest("Failed to update location.");
            }
        }
        else
        {
            existingItem.ParentItemId = updateItemDto.ParentItemId;
        }

        await _itemRepository.UpdateAsync(existingItem);
        
        // Update tags if provided
        if (updateItemDto.Tags != null)
        {
            await _tagService.ReplaceItemTagsAsync(existingItem.Id, updateItemDto.Tags);
        }

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

    private async Task<object> BuildTreeNodeAsync(Item item)
    {
        var children = await _itemRepository.GetByParentAsync(item.Id);
        var childrenNodes = new List<object>();

        foreach (var child in children)
        {
            childrenNodes.Add(await BuildTreeNodeAsync(child));
        }

        return new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.NodeIndex,
            item.Path,
            item.Depth,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.Icon,
                item.ItemType.CanContainItems,
                item.ItemType.IsLeaf,
                item.ItemType.Color,
                item.ItemType.SortOrder
            } : null,
            Children = childrenNodes
        };
    }

    private async Task<List<string>> GetItemTagNamesAsync(Guid itemId)
    {
        var tags = await _tagService.GetItemTagsAsync(itemId);
        return tags.Select(t => t.Name).ToList();
    }

    private async Task<object[]> ProjectItemsAsync(IEnumerable<Item> items)
    {
        return await Task.WhenAll(items.Select(ProjectItemAsync));
    }

    private async Task<object> ProjectSyncItemAsync(Item item)
    {
        if (item.Deleted)
        {
            return new
            {
                item.Id,
                item.UpdatedAt,
                item.Deleted,
            };
        }

        return new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.Deleted,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null && !item.ItemType.Deleted ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.Icon,
                item.ItemType.CanContainItems,
                item.ItemType.IsLeaf,
                item.ItemType.Color,
                item.ItemType.SortOrder,
                item.ItemType.UpdatedAt,
                item.ItemType.Deleted,
            } : null,
            ParentItemId = item.ParentItemId,
            parent = item.Parent != null && !item.Parent.Deleted ? BuildLocationItem(item.Parent) : null,
            ChildrenCount = await _itemRepository.GetChildrenCountAsync(item.Id)
        };
    }

    private async Task<object> ProjectItemAsync(Item item)
    {
        return new
        {
            item.Id,
            item.Name,
            item.Description,
            item.UniqueCode,
            Tags = await GetItemTagNamesAsync(item.Id),
            item.ImagePath,
            item.AddedAt,
            item.UpdatedAt,
            item.Deleted,
            ItemTypeId = item.ItemTypeId,
            ItemType = item.ItemType != null ? new
            {
                item.ItemType.Id,
                item.ItemType.Name,
                item.ItemType.Description,
                item.ItemType.UpdatedAt,
                item.ItemType.Deleted,
            } : null,
            ParentItemId = item.ParentItemId,
            parent = BuildLocationItem(item.Parent),
            ChildrenCount = await _itemRepository.GetChildrenCountAsync(item.Id)
        };
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
            parent = BuildLocationItem(item.Parent)
        };
    }
}