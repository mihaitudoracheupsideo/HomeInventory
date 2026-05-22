using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public sealed class AlertOccurrenceRepository : IAlertOccurrenceRepository
{
    private readonly AppDbContext _context;

    public AlertOccurrenceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<AlertOccurrence>> GetActiveAsync(int? take = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AlertOccurrences
            .AsNoTracking()
            .Where(occurrence => occurrence.Status != AlertOccurrenceStatus.Solved)
            .OrderByDescending(occurrence => occurrence.DueAtUtc < DateTime.UtcNow)
            .ThenBy(occurrence => occurrence.DueAtUtc)
            .ThenBy(occurrence => occurrence.GeneratedAtUtc)
            .AsQueryable();

        if (take.HasValue)
        {
            query = query.Take(take.Value);
        }

        return await query.ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<AlertOccurrence>> GetHistoryAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        return await _context.AlertOccurrences
            .AsNoTracking()
            .OrderByDescending(occurrence => occurrence.GeneratedAtUtc)
            .Take(Math.Max(1, take))
            .ToArrayAsync(cancellationToken);
    }

    public async Task<AlertOccurrence?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AlertOccurrences.FirstOrDefaultAsync(occurrence => occurrence.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsForPeriodAsync(Guid alertDefinitionId, string periodKey, CancellationToken cancellationToken = default)
    {
        return await _context.AlertOccurrences
            .AnyAsync(
                occurrence => occurrence.AlertDefinitionId == alertDefinitionId && occurrence.PeriodKey == periodKey,
                cancellationToken);
    }

    public async Task<bool> HasUnresolvedOccurrenceAsync(Guid alertDefinitionId, CancellationToken cancellationToken = default)
    {
        return await _context.AlertOccurrences
            .AnyAsync(
                occurrence => occurrence.AlertDefinitionId == alertDefinitionId && occurrence.Status != AlertOccurrenceStatus.Solved,
                cancellationToken);
    }

    public async Task AddAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default)
    {
        await _context.AlertOccurrences.AddAsync(occurrence, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default)
    {
        _context.AlertOccurrences.Update(occurrence);
        await _context.SaveChangesAsync(cancellationToken);
    }
}