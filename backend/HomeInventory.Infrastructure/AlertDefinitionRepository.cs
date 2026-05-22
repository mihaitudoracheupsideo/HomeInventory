using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public sealed class AlertDefinitionRepository : IAlertDefinitionRepository
{
    private readonly AppDbContext _context;

    public AlertDefinitionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<AlertDefinition>> GetAllOrderedAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AlertDefinitions
            .AsNoTracking()
            .OrderBy(definition => definition.SourceModule)
            .ThenBy(definition => definition.Name)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<AlertDefinition>> GetEnabledAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AlertDefinitions
            .Where(definition => definition.IsEnabled)
            .OrderBy(definition => definition.SourceModule)
            .ThenBy(definition => definition.Name)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<AlertDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AlertDefinitions.FirstOrDefaultAsync(definition => definition.Id == id, cancellationToken);
    }

    public async Task AddAsync(AlertDefinition definition, CancellationToken cancellationToken = default)
    {
        await _context.AlertDefinitions.AddAsync(definition, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AlertDefinition definition, CancellationToken cancellationToken = default)
    {
        _context.AlertDefinitions.Update(definition);
        await _context.SaveChangesAsync(cancellationToken);
    }
}