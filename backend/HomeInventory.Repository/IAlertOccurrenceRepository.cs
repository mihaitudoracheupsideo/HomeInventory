using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.Repository;

public interface IAlertOccurrenceRepository
{
    Task<IReadOnlyCollection<AlertOccurrence>> GetActiveAsync(int? take = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AlertOccurrence>> GetHistoryAsync(int take = 100, CancellationToken cancellationToken = default);
    Task<AlertOccurrence?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsForPeriodAsync(Guid alertDefinitionId, string periodKey, CancellationToken cancellationToken = default);
    Task<bool> HasUnresolvedOccurrenceAsync(Guid alertDefinitionId, CancellationToken cancellationToken = default);
    Task AddAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default);
    Task UpdateAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default);
}