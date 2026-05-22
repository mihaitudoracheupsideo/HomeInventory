using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;

namespace HomeInventory.Application.Alerts;

public interface IAlertOccurrenceService
{
    Task<IReadOnlyCollection<AlertOccurrenceDto>> GetActiveAsync(int? take = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AlertOccurrenceDto>> GetHistoryAsync(int take = 100, CancellationToken cancellationToken = default);
    Task<AlertOccurrenceDto?> MarkNoticedAsync(Guid occurrenceId, CancellationToken cancellationToken = default);
    Task<AlertOccurrenceDto?> MarkSolvedAsync(Guid occurrenceId, CancellationToken cancellationToken = default);
    Task<AlertOccurrenceDto?> ResendNotificationAsync(Guid occurrenceId, CancellationToken cancellationToken = default);
}

public interface IAlertProcessingService
{
    Task<AlertProcessingResultDto> ProcessAsync(CancellationToken cancellationToken = default);
}

public sealed class AlertOccurrenceService : IAlertOccurrenceService, IAlertProcessingService
{
    private readonly IAlertDefinitionRepository _definitionRepository;
    private readonly IAlertOccurrenceRepository _occurrenceRepository;
    private readonly IAlertScheduleCalculator _scheduleCalculator;
    private readonly IAlertNotificationService _alertNotificationService;

    public AlertOccurrenceService(
        IAlertDefinitionRepository definitionRepository,
        IAlertOccurrenceRepository occurrenceRepository,
        IAlertScheduleCalculator scheduleCalculator,
        IAlertNotificationService alertNotificationService)
    {
        _definitionRepository = definitionRepository;
        _occurrenceRepository = occurrenceRepository;
        _scheduleCalculator = scheduleCalculator;
        _alertNotificationService = alertNotificationService;
    }

    public async Task<IReadOnlyCollection<AlertOccurrenceDto>> GetActiveAsync(int? take = null, CancellationToken cancellationToken = default)
    {
        var occurrences = await _occurrenceRepository.GetActiveAsync(take, cancellationToken);
        return occurrences.Select(Map).ToArray();
    }

    public async Task<IReadOnlyCollection<AlertOccurrenceDto>> GetHistoryAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        var occurrences = await _occurrenceRepository.GetHistoryAsync(take, cancellationToken);
        return occurrences.Select(Map).ToArray();
    }

    public async Task<AlertOccurrenceDto?> MarkNoticedAsync(Guid occurrenceId, CancellationToken cancellationToken = default)
    {
        var occurrence = await _occurrenceRepository.GetByIdAsync(occurrenceId, cancellationToken);
        if (occurrence == null)
        {
            return null;
        }

        if (occurrence.Status == AlertOccurrenceStatus.Solved)
        {
            return Map(occurrence);
        }

        occurrence.Status = AlertOccurrenceStatus.Noticed;
        occurrence.NoticedAtUtc ??= DateTime.UtcNow;
        occurrence.UpdatedAtUtc = DateTime.UtcNow;

        await _occurrenceRepository.UpdateAsync(occurrence, cancellationToken);
        return Map(occurrence);
    }

    public async Task<AlertOccurrenceDto?> MarkSolvedAsync(Guid occurrenceId, CancellationToken cancellationToken = default)
    {
        var occurrence = await _occurrenceRepository.GetByIdAsync(occurrenceId, cancellationToken);
        if (occurrence == null)
        {
            return null;
        }

        occurrence.Status = AlertOccurrenceStatus.Solved;
        occurrence.SolvedAtUtc = DateTime.UtcNow;
        occurrence.UpdatedAtUtc = DateTime.UtcNow;

        await _occurrenceRepository.UpdateAsync(occurrence, cancellationToken);
        return Map(occurrence);
    }

    public async Task<AlertOccurrenceDto?> ResendNotificationAsync(Guid occurrenceId, CancellationToken cancellationToken = default)
    {
        var occurrence = await _occurrenceRepository.GetByIdAsync(occurrenceId, cancellationToken);
        if (occurrence == null)
        {
            return null;
        }

        if (occurrence.Status == AlertOccurrenceStatus.Solved)
        {
            throw new InvalidOperationException("Solved alerts cannot be resent.");
        }

        await _alertNotificationService.SendAlertOccurrenceEmailAsync(occurrence, cancellationToken);
        return Map(occurrence);
    }

    public async Task<AlertProcessingResultDto> ProcessAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var createdOccurrences = 0;
        var definitions = await _definitionRepository.GetEnabledAsync(cancellationToken);

        foreach (var definition in definitions)
        {
            var scheduleWindow = _scheduleCalculator.GetCurrentWindow(definition, nowUtc);
            if (scheduleWindow == null)
            {
                continue;
            }

            if (await _occurrenceRepository.ExistsForPeriodAsync(definition.Id, scheduleWindow.PeriodKey, cancellationToken))
            {
                continue;
            }

            if (await _occurrenceRepository.HasUnresolvedOccurrenceAsync(definition.Id, cancellationToken))
            {
                continue;
            }

            var occurrence = new AlertOccurrence
            {
                Id = Guid.NewGuid(),
                AlertDefinitionId = definition.Id,
                PeriodKey = scheduleWindow.PeriodKey,
                DefinitionNameSnapshot = definition.Name,
                SourceModuleSnapshot = definition.SourceModule,
                Message = RenderMessage(definition),
                GeneratedAtUtc = nowUtc,
                ActiveFromUtc = scheduleWindow.ActiveFromUtc,
                DueAtUtc = scheduleWindow.DueAtUtc,
                Status = AlertOccurrenceStatus.Active,
                PayloadJson = definition.MetadataJson,
                UpdatedAtUtc = nowUtc,
            };

            await _occurrenceRepository.AddAsync(occurrence, cancellationToken);
            createdOccurrences++;
            await _alertNotificationService.NotifyAlertCreatedAsync(occurrence, cancellationToken);
        }

        return new AlertProcessingResultDto(createdOccurrences, nowUtc);
    }

    private static string RenderMessage(AlertDefinition definition)
    {
        return definition.MessageTemplate
            .Replace("{{AlertName}}", definition.Name, StringComparison.OrdinalIgnoreCase)
            .Replace("{{SourceModule}}", definition.SourceModule, StringComparison.OrdinalIgnoreCase);
    }

    private static AlertOccurrenceDto Map(AlertOccurrence occurrence)
    {
        var isOverdue = occurrence.Status != AlertOccurrenceStatus.Solved && occurrence.DueAtUtc < DateTime.UtcNow;
        var daysOverdue = isOverdue
            ? Math.Max(1, (int)Math.Ceiling((DateTime.UtcNow - occurrence.DueAtUtc).TotalDays))
            : 0;

        return new AlertOccurrenceDto(
            occurrence.Id,
            occurrence.AlertDefinitionId,
            occurrence.DefinitionNameSnapshot,
            occurrence.SourceModuleSnapshot,
            occurrence.Message,
            occurrence.Status.ToString(),
            occurrence.PeriodKey,
            occurrence.GeneratedAtUtc,
            occurrence.ActiveFromUtc,
            occurrence.DueAtUtc,
            occurrence.NoticedAtUtc,
            occurrence.SolvedAtUtc,
            isOverdue,
            daysOverdue);
    }
}