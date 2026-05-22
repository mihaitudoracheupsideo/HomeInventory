using Coravel.Invocable;
using HomeInventory.Application.Alerts;

namespace HomeInventory.WebApi.Alerts;

public sealed class ProcessAlertOccurrencesInvocable : IInvocable
{
    private readonly IAlertProcessingService _alertProcessingService;
    private readonly ILogger<ProcessAlertOccurrencesInvocable> _logger;

    public ProcessAlertOccurrencesInvocable(
        IAlertProcessingService alertProcessingService,
        ILogger<ProcessAlertOccurrencesInvocable> logger)
    {
        _alertProcessingService = alertProcessingService;
        _logger = logger;
    }

    public async Task Invoke()
    {
        var result = await _alertProcessingService.ProcessAsync();
        if (result.CreatedOccurrences > 0)
        {
            _logger.LogInformation("Generated {CreatedOccurrences} alert occurrence(s) at {ProcessedAtUtc}.", result.CreatedOccurrences, result.ProcessedAtUtc);
        }
    }
}