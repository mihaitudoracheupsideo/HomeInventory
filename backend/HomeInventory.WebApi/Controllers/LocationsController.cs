using HomeInventory.Domain.Entities;
using HomeInventory.Repository;
using HomeInventory.Application;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepository;
    private readonly ITagService _tagService;

    public LocationsController(ILocationRepository locationRepository, ITagService tagService)
    {
        _locationRepository = locationRepository;
        _tagService = tagService;
    }

    // GET: api/locations/current/{itemId}
    [HttpGet("current/{itemId}")]
    public async Task<IActionResult> GetCurrentLocation(Guid itemId)
    {
        var location = await _locationRepository.GetCurrentLocationForItemAsync(itemId);
        if (location == null)
        {
            return NotFound();
        }
        return Ok(new
        {
            location.ItemId,
            location.LocationItemId,
            location.AddedAt,
            LocationItem = new
            {
                location.LocationItem?.Id,
                location.LocationItem?.Name,
                location.LocationItem?.Description,
                location.LocationItem?.UniqueCode
            }
        });
    }

    // GET: api/locations/history/{itemId}
    [HttpGet("history/{itemId}")]
    public async Task<IActionResult> GetLocationHistory(Guid itemId)
    {
        var locations = await _locationRepository.GetLocationHistoryForItemAsync(itemId);
        var orderedLocations = locations.OrderBy(l => l.AddedAt).ToList();
        var timeline = orderedLocations.Select((location, index) => new
        {
            location.Id,
            location.ItemId,
            location.LocationItemId,
            location.AddedAt,
            EndedAt = index < orderedLocations.Count - 1 ? orderedLocations[index + 1].AddedAt : (DateTime?)null,
            location.Current,
            LocationItem = new
            {
                location.LocationItem?.Id,
                location.LocationItem?.Name,
                location.LocationItem?.Description,
                location.LocationItem?.UniqueCode
            }
        });

        return Ok(timeline.Reverse());
    }

    // GET: api/locations/items/{locationItemId}
    [HttpGet("items/{locationItemId}")]
    public async Task<IActionResult> GetItemsInLocation(Guid locationItemId)
    {
        var items = await _locationRepository.GetItemsInLocationAsync(locationItemId);
        var result = await Task.WhenAll(items.Select(async i => new
        {
            i.Id,
            i.Name,
            i.Description,
            i.UniqueCode,
            Tags = await GetItemTagNamesAsync(i.Id),
            i.ImagePath,
            i.AddedAt
        }));
        return Ok(result);
    }

    private async Task<List<string>> GetItemTagNamesAsync(Guid itemId)
    {
        var tags = await _tagService.GetItemTagsAsync(itemId);
        return tags.Select(t => t.Name).ToList();
    }

    // POST: api/locations
    [HttpPost]
    public async Task<IActionResult> SetLocation([FromBody] SetLocationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var success = await _locationRepository.SetCurrentLocationAsync(request.ItemId, request.LocationItemId);
        if (!success)
        {
            return BadRequest("Failed to set location");
        }

        return Ok();
    }

    // DELETE: api/locations/{itemId}
    [HttpDelete("{itemId}")]
    public async Task<IActionResult> RemoveCurrentLocation(Guid itemId)
    {
        // This would require additional logic to handle removing current location
        // For now, we'll just return not implemented
        return StatusCode(501, "Remove current location not implemented");
    }
}

public class SetLocationRequest
{
    public Guid ItemId { get; set; }
    public Guid? LocationItemId { get; set; }
}