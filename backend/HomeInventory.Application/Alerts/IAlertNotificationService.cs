using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.Application.Alerts;

public interface IAlertNotificationService
{
    Task NotifyAlertCreatedAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default);
    Task SendAlertOccurrenceEmailAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default);
    Task SendTestEmailAsync(CancellationToken cancellationToken = default);
}