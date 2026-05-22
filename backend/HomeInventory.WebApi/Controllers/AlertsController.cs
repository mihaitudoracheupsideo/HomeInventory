using HomeInventory.Application.Alerts;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AlertsController : ControllerBase
{
    private readonly IAlertOccurrenceService _alertOccurrenceService;

    public AlertsController(IAlertOccurrenceService alertOccurrenceService)
    {
        _alertOccurrenceService = alertOccurrenceService;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] int? take = null, CancellationToken cancellationToken = default)
    {
        var alerts = await _alertOccurrenceService.GetActiveAsync(take, cancellationToken);
        return Ok(alerts);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int take = 100, CancellationToken cancellationToken = default)
    {
        var alerts = await _alertOccurrenceService.GetHistoryAsync(take, cancellationToken);
        return Ok(alerts);
    }

    [HttpPost("{id:guid}/noticed")]
    public async Task<IActionResult> MarkNoticed(Guid id, CancellationToken cancellationToken = default)
    {
        var alert = await _alertOccurrenceService.MarkNoticedAsync(id, cancellationToken);
        return alert == null ? NotFound() : Ok(alert);
    }

    [HttpPost("{id:guid}/solved")]
    public async Task<IActionResult> MarkSolved(Guid id, CancellationToken cancellationToken = default)
    {
        var alert = await _alertOccurrenceService.MarkSolvedAsync(id, cancellationToken);
        return alert == null ? NotFound() : Ok(alert);
    }

    [HttpPost("{id:guid}/resend-email")]
    public async Task<IActionResult> ResendEmail(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var alert = await _alertOccurrenceService.ResendNotificationAsync(id, cancellationToken);
            return alert == null ? NotFound() : Ok(alert);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}