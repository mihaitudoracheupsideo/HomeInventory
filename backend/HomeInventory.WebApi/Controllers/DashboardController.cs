using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IItemRepository _itemRepository;
    private readonly IItemTypeRepository _itemTypeRepository;

    public DashboardController(IItemRepository itemRepository, IItemTypeRepository itemTypeRepository)
    {
        _itemRepository = itemRepository;
        _itemTypeRepository = itemTypeRepository;
    }

    // GET: api/dashboard/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var allItems = await _itemRepository.GetAllAsync();
        var itemTypes = await _itemTypeRepository.GetAllAsync();

        var totalItems = allItems.Count();
        var totalContainers = allItems.Count(i => i.ItemType?.CanContainItems == true);
        var rootItems = allItems.Count(i => i.ParentItemId == null);
        var recentItems = allItems.OrderByDescending(i => i.AddedAt).Take(10);
        var itemsWithoutParent = allItems.Count(i => i.ParentItemId == null && i.ItemType?.CanContainItems == false);
        var itemsByType = itemTypes.ToDictionary(
            it => it.Name,
            it => allItems.Count(i => i.ItemTypeId == it.Id)
        );
        var recentlyScanned = allItems.OrderByDescending(i => i.UpdatedAt).Take(5);

        return Ok(new
        {
            totalItems,
            totalContainers,
            rootItems,
            recentItems = recentItems.Select(i => new
            {
                i.Id,
                i.Name,
                i.UniqueCode,
                i.AddedAt,
                ItemType = i.ItemType?.Name
            }),
            itemsWithoutParent,
            itemsByType,
            recentlyScanned = recentlyScanned.Select(i => new
            {
                i.Id,
                i.Name,
                i.UniqueCode,
                i.UpdatedAt,
                ItemType = i.ItemType?.Name
            })
        });
    }
}