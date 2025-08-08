using HomeInventory.Domain;
using HomeInventory.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.WebApi;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ItemsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/items
    [HttpGet]
    public async Task<IActionResult> GetItems()
    {
        var items = await _context.Item.Include(i => i.ItemType).ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _context.Item.Include(i => i.ItemType).FirstOrDefaultAsync(i => i.Id == id);
        if (item == null)
            return NotFound();
        return Ok(item);
    }  

    // POST: api/Items
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Item item)
    {
        item.Id = Guid.NewGuid();
        _context.Item.Add(item);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    // PUT: api/Items/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Item item)
    {
        if (id != item.Id)
            return BadRequest();

        _context.Entry(item).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Item.AnyAsync(e => e.Id == id))
                return NotFound();
            throw;
        }
        return NoContent();
    }

    // DELETE: api/Items/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _context.Item.FindAsync(id);
        if (item == null)
            return NotFound();

        _context.Item.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}