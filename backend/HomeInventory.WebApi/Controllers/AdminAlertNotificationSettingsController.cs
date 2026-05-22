using HomeInventory.Application.Alerts;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/admin/alert-notification-settings")]
public sealed class AdminAlertNotificationSettingsController : ControllerBase
{
    private readonly IAlertNotificationSettingsService _settingsService;

    public AdminAlertNotificationSettingsController(IAlertNotificationSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        var settings = await _settingsService.GetAsync(cancellationToken);
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateAlertNotificationSettingsDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await _settingsService.UpdateAsync(dto, cancellationToken);
            return Ok(settings);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> SendTestEmail(CancellationToken cancellationToken = default)
    {
        try
        {
            await _settingsService.GetAsync(cancellationToken);
            var notificationService = HttpContext.RequestServices.GetRequiredService<IAlertNotificationService>();
            await notificationService.SendTestEmailAsync(cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}