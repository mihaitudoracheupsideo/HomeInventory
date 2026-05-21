using HomeInventory.Application;
using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;
    private readonly ITagRepository _tagRepository;

    public TagsController(ITagService tagService, ITagRepository tagRepository)
    {
        _tagService = tagService;
        _tagRepository = tagRepository;
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

    [HttpGet("sync")]
    public async Task<IActionResult> Sync([FromQuery] DateTime? since = null)
    {
        var tags = await _tagRepository.GetChangesSinceAsync(since);
        var usageCounts = await Task.WhenAll(tags.Select(async tag => new
        {
            Tag = tag,
            UsageCount = tag.Deleted ? 0 : await _tagRepository.GetUsageCountAsync(tag.Id)
        }));

        var filteredTags = usageCounts.Select(result => new
            {
                result.Tag.Id,
                result.Tag.Name,
                result.Tag.NormalizedName,
                result.Tag.Type,
                result.Tag.Color,
                result.Tag.Icon,
                result.Tag.UpdatedAt,
                result.Tag.Deleted,
                result.UsageCount,
                CanDelete = result.UsageCount == 0,
            });

        return Ok(new SyncResponse<object>
        {
            Data = filteredTags,
            SyncTimestamp = DateTime.UtcNow,
        });
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