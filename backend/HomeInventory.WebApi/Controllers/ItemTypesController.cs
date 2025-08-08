using HomeInventory.Infrastructure;
using HomeInventory.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemTypesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ItemTypes
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var itemTypes = await _context.ItemType.ToListAsync();
            return Ok(itemTypes);
        }

        // GET: api/ItemTypes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var itemType = await _context.ItemType.FindAsync(id);
            if (itemType == null)
                return NotFound();
            return Ok(itemType);
        }

        // POST: api/ItemTypes
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ItemType itemType)
        {
            itemType.Id = Guid.NewGuid();
            _context.ItemType.Add(itemType);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = itemType.Id }, itemType);
        }

        // PUT: api/ItemTypes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ItemType itemType)
        {
            if (id != itemType.Id)
                return BadRequest();

            _context.Entry(itemType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ItemType.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/ItemTypes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var itemType = await _context.ItemType.FindAsync(id);
            if (itemType == null)
                return NotFound();

            _context.ItemType.Remove(itemType);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}