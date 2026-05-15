using HomeInventory.Application.Services;
using HomeInventory.Domain.Entities;
using HomeInventory.Repository;

namespace HomeInventory.Application;

public interface ITagService
{
    Task<Tag> CreateTagAsync(CreateTagDto dto);
    Task<Tag?> GetTagByIdAsync(Guid id);
    Task<Tag?> GetTagByNormalizedNameAsync(string normalizedName);
    Task<IEnumerable<Tag>> SearchTagsAsync(string query, int maxResults = 10);
    Task<IEnumerable<TagUsageResult>> GetAllTagsWithUsageAsync();
    Task<IEnumerable<TagUsageResult>> SearchTagsWithUsageAsync(string query, int maxResults = 10);
    Task<Tag> UpdateTagAsync(Guid id, UpdateTagDto dto);
    Task<bool> DeleteTagAsync(Guid id);
    Task AssignTagsToItemAsync(Guid itemId, IEnumerable<string> tagNames);
    Task RemoveTagFromItemAsync(Guid itemId, Guid tagId);
    Task<IEnumerable<Tag>> GetItemTagsAsync(Guid itemId);
}

public class TagService : ITagService
{
    private readonly ITagRepository _tagRepository;
    private readonly IItemRepository _itemRepository;
    private readonly IItemTagRepository _itemTagRepository;
    private readonly ITagNormalizer _tagNormalizer;

    public TagService(
        ITagRepository tagRepository,
        IItemRepository itemRepository,
        IItemTagRepository itemTagRepository,
        ITagNormalizer tagNormalizer)
    {
        _tagRepository = tagRepository;
        _itemRepository = itemRepository;
        _itemTagRepository = itemTagRepository;
        _tagNormalizer = tagNormalizer;
    }

    public async Task<Tag> CreateTagAsync(CreateTagDto dto)
    {
        var normalizedName = _tagNormalizer.Normalize(dto.Name);

        // Check if tag already exists
        var existingTag = await _tagRepository.GetByNormalizedNameAsync(normalizedName);
        if (existingTag != null)
        {
            throw new InvalidOperationException($"Tag with name '{dto.Name}' already exists.");
        }

        var tag = new Tag
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            NormalizedName = normalizedName,
            Type = dto.Type,
            Color = dto.Color,
            Icon = dto.Icon
        };

        await _tagRepository.AddAsync(tag);
        return tag;
    }

    public async Task<Tag?> GetTagByIdAsync(Guid id)
    {
        return await _tagRepository.GetByIdAsync(id);
    }

    public async Task<Tag?> GetTagByNormalizedNameAsync(string normalizedName)
    {
        return await _tagRepository.GetByNormalizedNameAsync(normalizedName);
    }

    public async Task<IEnumerable<Tag>> SearchTagsAsync(string query, int maxResults = 10)
    {
        return await _tagRepository.SearchAsync(query, maxResults);
    }

    public async Task<IEnumerable<TagUsageResult>> GetAllTagsWithUsageAsync()
    {
        return await _tagRepository.GetAllWithUsageAsync();
    }

    public async Task<IEnumerable<TagUsageResult>> SearchTagsWithUsageAsync(string query, int maxResults = 10)
    {
        return await _tagRepository.SearchWithUsageAsync(query, maxResults);
    }

    public async Task<Tag> UpdateTagAsync(Guid id, UpdateTagDto dto)
    {
        var tag = await _tagRepository.GetByIdAsync(id);
        if (tag == null)
        {
            throw new KeyNotFoundException($"Tag with ID {id} not found.");
        }

        var normalizedName = _tagNormalizer.Normalize(dto.Name);

        // Check if another tag with the same normalized name exists
        var existingTag = await _tagRepository.GetByNormalizedNameAsync(normalizedName);
        if (existingTag != null && existingTag.Id != id)
        {
            throw new InvalidOperationException($"Tag with name '{dto.Name}' already exists.");
        }

        tag.Name = dto.Name;
        tag.NormalizedName = normalizedName;
        tag.Type = dto.Type;
        tag.Color = dto.Color;
        tag.Icon = dto.Icon;

        await _tagRepository.UpdateAsync(tag);
        return tag;
    }

    public async Task<bool> DeleteTagAsync(Guid id)
    {
        var tag = await _tagRepository.GetByIdAsync(id);
        if (tag == null)
        {
            return false;
        }

        var usageCount = await _tagRepository.GetUsageCountAsync(id);
        if (usageCount > 0)
        {
            throw new InvalidOperationException("Tag cannot be deleted because it is assigned to one or more items.");
        }

        await _tagRepository.DeleteAsync(tag);
        return true;
    }

    public async Task AssignTagsToItemAsync(Guid itemId, IEnumerable<string> tagNames)
    {
        var item = await _itemRepository.GetByIdAsync(itemId);
        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {itemId} not found.");
        }

        foreach (var tagName in tagNames.Distinct())
        {
            var normalizedName = _tagNormalizer.Normalize(tagName);
            if (string.IsNullOrEmpty(normalizedName))
                continue;

            var tag = await _tagRepository.GetByNormalizedNameAsync(normalizedName);
            if (tag == null)
            {
                // Create new tag
                tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    Name = tagName.Trim(),
                    NormalizedName = normalizedName,
                    Type = TagType.Generic
                };
                await _tagRepository.AddAsync(tag);
            }

            // Check if relationship already exists
            var existingRelation = await _itemTagRepository.FindAsync(it => it.ItemId == itemId && it.TagId == tag.Id);
            if (!existingRelation.Any())
            {
                var itemTag = new ItemTag
                {
                    ItemId = itemId,
                    TagId = tag.Id
                };
                await _itemTagRepository.AddAsync(itemTag);
            }
        }
    }

    public async Task RemoveTagFromItemAsync(Guid itemId, Guid tagId)
    {
        var itemTag = await _itemTagRepository.FindAsync(it => it.ItemId == itemId && it.TagId == tagId);
        var relation = itemTag.FirstOrDefault();
        if (relation != null)
        {
            await _itemTagRepository.DeleteAsync(relation);
        }
    }

    public async Task<IEnumerable<Tag>> GetItemTagsAsync(Guid itemId)
    {
        var itemTags = await _itemTagRepository.GetItemTagsWithTagsAsync(itemId);
        return itemTags.Select(it => it.Tag);
    }
}