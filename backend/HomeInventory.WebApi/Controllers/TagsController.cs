using HomeInventory.Application;
using HomeInventory.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _tagService.SearchTagsAsync("", 1000); // Get all tags
        var tagDtos = tags.Select(t => new TagDto
        {
            Id = t.Id,
            Name = t.Name,
            NormalizedName = t.NormalizedName,
            Type = t.Type,
            Color = t.Color,
            Icon = t.Icon
        });
        return Ok(tagDtos);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchTags([FromQuery] string query, [FromQuery] int maxResults = 10)
    {
        var tags = await _tagService.SearchTagsAsync(query, maxResults);
        var tagDtos = tags.Select(t => new TagDto
        {
            Id = t.Id,
            Name = t.Name,
            NormalizedName = t.NormalizedName,
            Type = t.Type,
            Color = t.Color,
            Icon = t.Icon
        });
        return Ok(tagDtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTag(Guid id)
    {
        var tag = await _tagService.GetTagByIdAsync(id);
        if (tag == null)
        {
            return NotFound();
        }

        var tagDto = new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            NormalizedName = tag.NormalizedName,
            Type = tag.Type,
            Color = tag.Color,
            Icon = tag.Icon
        };
        return Ok(tagDto);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTag(CreateTagDto dto)
    {
        try
        {
            var tag = await _tagService.CreateTagAsync(dto);
            var tagDto = new TagDto
            {
                Id = tag.Id,
                Name = tag.Name,
                NormalizedName = tag.NormalizedName,
                Type = tag.Type,
                Color = tag.Color,
                Icon = tag.Icon
            };
            return CreatedAtAction(nameof(GetTag), new { id = tag.Id }, tagDto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTag(Guid id, UpdateTagDto dto)
    {
        try
        {
            var tag = await _tagService.UpdateTagAsync(id, dto);
            var tagDto = new TagDto
            {
                Id = tag.Id,
                Name = tag.Name,
                NormalizedName = tag.NormalizedName,
                Type = tag.Type,
                Color = tag.Color,
                Icon = tag.Icon
            };
            return Ok(tagDto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTag(Guid id)
    {
        var deleted = await _tagService.DeleteTagAsync(id);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpPost("items/{itemId}/tags")]
    public async Task<IActionResult> AssignTagsToItem(Guid itemId, [FromBody] List<string> tagNames)
    {
        try
        {
            await _tagService.AssignTagsToItemAsync(itemId, tagNames);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Item not found");
        }
    }

    [HttpDelete("items/{itemId}/tags/{tagId}")]
    public async Task<IActionResult> RemoveTagFromItem(Guid itemId, Guid tagId)
    {
        await _tagService.RemoveTagFromItemAsync(itemId, tagId);
        return NoContent();
    }

    [HttpGet("items/{itemId}/tags")]
    public async Task<IActionResult> GetItemTags(Guid itemId)
    {
        var tags = await _tagService.GetItemTagsAsync(itemId);
        var tagDtos = tags.Select(t => new TagDto
        {
            Id = t.Id,
            Name = t.Name,
            NormalizedName = t.NormalizedName,
            Type = t.Type,
            Color = t.Color,
            Icon = t.Icon
        });
        return Ok(tagDtos);
    }
}