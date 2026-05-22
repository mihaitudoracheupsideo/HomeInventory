using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.Repository;

public interface IAlertNotificationSettingsRepository
{
    Task<AlertNotificationSettings?> GetAsync(CancellationToken cancellationToken = default);
    Task AddAsync(AlertNotificationSettings settings, CancellationToken cancellationToken = default);
    Task UpdateAsync(AlertNotificationSettings settings, CancellationToken cancellationToken = default);
}