using HomeInventory.Repository;
using HomeInventory.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace HomeInventory.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemTypesController : ControllerBase
    {
        private readonly IItemTypeRepository _itemTypeRepository;
        private readonly IMemoryCache _cache;

        public ItemTypesController(IItemTypeRepository itemTypeRepository, IMemoryCache cache)
        {
            _itemTypeRepository = itemTypeRepository;
            _cache = cache;
        }

        // GET: api/ItemTypes
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 10)
        {
            const string cacheKey = "itemtypes_list";
            if (!_cache.TryGetValue(cacheKey, out IEnumerable<ItemType>? itemTypes))
            {
                itemTypes = await _itemTypeRepository.GetAllAsync();
                _cache.Set(cacheKey, itemTypes, TimeSpan.FromMinutes(5));
            }
            var paginated = itemTypes!.Skip((page - 1) * pageSize).Take(pageSize);
            return Ok(new PaginatedResponse<ItemType> { Data = paginated, TotalCount = itemTypes!.Count() });
        }

        // GET: api/ItemTypes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var itemType = await _itemTypeRepository.GetByIdAsync(id);
            if (itemType == null)
                return NotFound();
            return Ok(itemType);
        }

        // POST: api/ItemTypes
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ItemType itemType)
        {
            itemType.Id = Guid.NewGuid();
            await _itemTypeRepository.AddAsync(itemType);
            _cache.Remove("itemtypes_list");
            return CreatedAtAction(nameof(GetById), new { id = itemType.Id }, itemType);
        }

        // PUT: api/ItemTypes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ItemType itemType)
        {
            if (id != itemType.Id)
                return BadRequest();

            await _itemTypeRepository.UpdateAsync(itemType);
            _cache.Remove("itemtypes_list");
            return NoContent();
        }

        // DELETE: api/ItemTypes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var itemType = await _itemTypeRepository.GetByIdAsync(id);
            if (itemType == null)
                return NotFound();

            await _itemTypeRepository.DeleteAsync(itemType);
            _cache.Remove("itemtypes_list");
            return NoContent();
        }
    }
}