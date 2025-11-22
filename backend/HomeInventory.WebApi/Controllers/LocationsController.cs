using HomeInventory.Domain;
using HomeInventory.Repository;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepository;

    public LocationsController(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
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
        return Ok(locations.Select(l => new
        {
            l.ItemId,
            l.LocationItemId,
            l.AddedAt,
            LocationItem = new
            {
                l.LocationItem?.Id,
                l.LocationItem?.Name,
                l.LocationItem?.Description,
                l.LocationItem?.UniqueCode
            }
        }));
    }

    // GET: api/locations/items/{locationItemId}
    [HttpGet("items/{locationItemId}")]
    public async Task<IActionResult> GetItemsInLocation(Guid locationItemId)
    {
        var items = await _locationRepository.GetItemsInLocationAsync(locationItemId);
        return Ok(items.Select(i => new
        {
            i.Id,
            i.Name,
            i.Description,
            i.UniqueCode,
            i.Tags,
            i.ImagePath,
            i.AddedAt
        }));
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
    public Guid LocationItemId { get; set; }
}