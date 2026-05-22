using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.Repository;

public interface IAlertDefinitionRepository
{
    Task<IReadOnlyCollection<AlertDefinition>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AlertDefinition>> GetEnabledAsync(CancellationToken cancellationToken = default);
    Task<AlertDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(AlertDefinition definition, CancellationToken cancellationToken = default);
    Task UpdateAsync(AlertDefinition definition, CancellationToken cancellationToken = default);
}