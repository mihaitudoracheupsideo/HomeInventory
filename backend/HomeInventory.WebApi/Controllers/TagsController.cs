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

    private static TagDto ToTagDto(Tag tag)
    {
        return new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            NormalizedName = tag.NormalizedName,
            Type = tag.Type,
            Color = tag.Color,
            Icon = tag.Icon
        };
    }

    private static TagListItemDto ToTagListItemDto(TagUsageResult result)
    {
        return new TagListItemDto
        {
            Id = result.Tag.Id,
            Name = result.Tag.Name,
            NormalizedName = result.Tag.NormalizedName,
            Type = result.Tag.Type,
            Color = result.Tag.Color,
            Icon = result.Tag.Icon,
            UsageCount = result.UsageCount,
            CanDelete = result.UsageCount == 0
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _tagService.GetAllTagsWithUsageAsync();
        var tagDtos = tags.Select(ToTagListItemDto);
        return Ok(tagDtos);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchTags([FromQuery] string query, [FromQuery] int maxResults = 10)
    {
        var tags = await _tagService.SearchTagsWithUsageAsync(query, maxResults);
        var tagDtos = tags.Select(ToTagListItemDto);
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

        var tagDto = ToTagDto(tag);
        return Ok(tagDto);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTag(CreateTagDto dto)
    {
        try
        {
            var tag = await _tagService.CreateTagAsync(dto);
            var tagDto = ToTagDto(tag);
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
            var tagDto = ToTagDto(tag);
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
        try
        {
            var deleted = await _tagService.DeleteTagAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
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
        var tagDtos = tags.Select(ToTagDto);
        return Ok(tagDtos);
    }
}