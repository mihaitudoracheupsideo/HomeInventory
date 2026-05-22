using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public sealed class AlertNotificationSettingsRepository : IAlertNotificationSettingsRepository
{
    private readonly AppDbContext _context;

    public AlertNotificationSettingsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AlertNotificationSettings?> GetAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AlertNotificationSettings.FirstOrDefaultAsync(
            settings => settings.Id == AlertNotificationSettings.SingletonId,
            cancellationToken);
    }

    public async Task AddAsync(AlertNotificationSettings settings, CancellationToken cancellationToken = default)
    {
        await _context.AlertNotificationSettings.AddAsync(settings, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AlertNotificationSettings settings, CancellationToken cancellationToken = default)
    {
        _context.AlertNotificationSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);
    }
}