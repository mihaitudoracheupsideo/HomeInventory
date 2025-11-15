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

    // POST: api/Items
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Item item)
    {
        item.Id = Guid.NewGuid();
        await _itemRepository.AddAsync(item);
        _cache.Remove("items_list");
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    // PUT: api/Items/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Item item)
    {
        if (id != item.Id)
            return BadRequest();

        await _itemRepository.UpdateAsync(item);
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
}