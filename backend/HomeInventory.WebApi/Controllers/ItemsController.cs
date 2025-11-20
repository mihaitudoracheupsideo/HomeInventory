using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace HomeInventory.WebApi;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly IItemRepository _itemRepository;
    private readonly IMemoryCache _cache;

    public ItemsController(IItemRepository itemRepository, IMemoryCache cache)
    {
        _itemRepository = itemRepository;
        _cache = cache;
    }

    // GET: api/items
    [HttpGet]
    public async Task<IActionResult> GetItems(int page = 1, int pageSize = 10)
    {
        const string cacheKey = "items_list";
        if (!_cache.TryGetValue(cacheKey, out IEnumerable<Item>? items))
        {
            items = await _itemRepository.GetItemsWithTypesAsync();
            _cache.Set(cacheKey, items, TimeSpan.FromMinutes(5));
        }
        var paginated = items!.Skip((page - 1) * pageSize).Take(pageSize);
        return Ok(new PaginatedResponse<Item> { Data = paginated, TotalCount = items!.Count() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _itemRepository.GetItemWithTypeAsync(id);
        if (item == null)
            return NotFound();
        return Ok(item);
    }

    [HttpGet("code/{uniqueCode}")]
    public async Task<IActionResult> GetByUniqueCode(string uniqueCode)
    {
        var item = await _itemRepository.GetItemByUniqueCodeAsync(uniqueCode);
        if (item == null)
            return NotFound();
        return Ok(item);
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
            ImagePath = createItemDto.ImagePath
        };
        
        // Generate unique code
        item.UniqueCode = GenerateUniqueCode();
        
        Console.WriteLine($"Generated UniqueCode: {item.UniqueCode}");
        
        await _itemRepository.AddAsync(item);
        _cache.Remove("items_list");
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    // PUT: api/Items/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateItemDto updateItemDto)
    {
        var existingItem = await _itemRepository.GetByIdAsync(id);
        if (existingItem == null)
            return NotFound();

        // Update only the fields that can be changed
        existingItem.Name = updateItemDto.Name;
        existingItem.Description = updateItemDto.Description;
        existingItem.ItemTypeId = updateItemDto.ItemTypeId;
        existingItem.Tags = updateItemDto.Tags ?? new List<string>();
        existingItem.ImagePath = updateItemDto.ImagePath;

        await _itemRepository.UpdateAsync(existingItem);
        _cache.Remove("items_list");
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
        _cache.Remove("items_list");
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
}