using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;

namespace HomeInventory.Application.Alerts;

public interface IAlertDefinitionService
{
    Task<IReadOnlyCollection<AlertDefinitionDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AlertDefinitionDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AlertDefinitionDto> CreateAsync(CreateAlertDefinitionDto dto, CancellationToken cancellationToken = default);
    Task<AlertDefinitionDto?> UpdateAsync(Guid id, UpdateAlertDefinitionDto dto, CancellationToken cancellationToken = default);
}

public sealed class AlertDefinitionService : IAlertDefinitionService
{
    private readonly IAlertDefinitionRepository _definitionRepository;
    private readonly IAlertScheduleCalculator _scheduleCalculator;

    public AlertDefinitionService(IAlertDefinitionRepository definitionRepository, IAlertScheduleCalculator scheduleCalculator)
    {
        _definitionRepository = definitionRepository;
        _scheduleCalculator = scheduleCalculator;
    }

    public async Task<IReadOnlyCollection<AlertDefinitionDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var definitions = await _definitionRepository.GetAllOrderedAsync(cancellationToken);
        return definitions
            .Select(Map)
            .ToArray();
    }

    public async Task<AlertDefinitionDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var definition = await _definitionRepository.GetByIdAsync(id, cancellationToken);
        return definition == null ? null : Map(definition);
    }

    public async Task<AlertDefinitionDto> CreateAsync(CreateAlertDefinitionDto dto, CancellationToken cancellationToken = default)
    {
        var definition = BuildDefinition(dto);
        definition.Id = Guid.NewGuid();
        definition.CreatedAtUtc = DateTime.UtcNow;
        definition.UpdatedAtUtc = definition.CreatedAtUtc;

        await _definitionRepository.AddAsync(definition, cancellationToken);
        return Map(definition);
    }

    public async Task<AlertDefinitionDto?> UpdateAsync(Guid id, UpdateAlertDefinitionDto dto, CancellationToken cancellationToken = default)
    {
        var definition = await _definitionRepository.GetByIdAsync(id, cancellationToken);
        if (definition == null)
        {
            return null;
        }

        ApplyChanges(definition, dto);
        definition.UpdatedAtUtc = DateTime.UtcNow;

        await _definitionRepository.UpdateAsync(definition, cancellationToken);
        return Map(definition);
    }

    private AlertDefinition BuildDefinition(CreateAlertDefinitionDto dto)
    {
        var definition = new AlertDefinition();
        ApplyChanges(definition, dto);
        return definition;
    }

    private void ApplyChanges(AlertDefinition definition, CreateAlertDefinitionDto dto)
    {
        definition.Name = dto.Name.Trim();
        definition.SourceModule = dto.SourceModule.Trim();
        definition.Frequency = ParseFrequency(dto.Frequency);
        definition.Interval = dto.Interval;
        definition.DayOfWeek = dto.DayOfWeek.HasValue ? (DayOfWeek?)dto.DayOfWeek.Value : null;
        definition.DayOfMonth = dto.DayOfMonth;
        definition.MonthOfYear = dto.MonthOfYear;
        definition.StartDateUtc = ParseDate(dto.StartDateUtc, nameof(dto.StartDateUtc));
        definition.DueTimeUtc = ParseTime(dto.DueTimeUtc);
        definition.LeadTimeDays = dto.LeadTimeDays;
        definition.MessageTemplate = dto.MessageTemplate.Trim();
        definition.IsEnabled = dto.IsEnabled;
        definition.MetadataJson = NormalizeOptional(dto.MetadataJson);
        definition.CronExpression = NormalizeOptional(dto.CronExpression);

        ValidateDefinition(definition);
    }

    private AlertDefinitionDto Map(AlertDefinition definition)
    {
        var nextDueAtUtc = definition.IsEnabled
            ? _scheduleCalculator.GetNextDueAtUtc(definition, DateTime.UtcNow.AddSeconds(-1))
            : null;

        return new AlertDefinitionDto(
            definition.Id,
            definition.Name,
            definition.SourceModule,
            definition.Frequency.ToString(),
            definition.Interval,
            definition.DayOfWeek.HasValue ? (int)definition.DayOfWeek.Value : null,
            definition.DayOfMonth,
            definition.MonthOfYear,
            definition.StartDateUtc.ToString("yyyy-MM-dd"),
            definition.DueTimeUtc.ToString("HH:mm:ss"),
            definition.LeadTimeDays,
            definition.MessageTemplate,
            definition.IsEnabled,
            definition.MetadataJson,
            definition.CronExpression,
            nextDueAtUtc?.ToString("O"),
            definition.CreatedAtUtc,
            definition.UpdatedAtUtc);
    }

    private static AlertRecurrenceType ParseFrequency(string rawFrequency)
    {
        if (!Enum.TryParse<AlertRecurrenceType>(rawFrequency, true, out var frequency))
        {
            throw new InvalidOperationException($"Unsupported alert frequency '{rawFrequency}'.");
        }

        return frequency;
    }

    private static DateOnly ParseDate(string rawDate, string fieldName)
    {
        if (!DateOnly.TryParse(rawDate, out var parsedDate))
        {
            throw new InvalidOperationException($"Field '{fieldName}' must be a valid ISO date.");
        }

        return parsedDate;
    }

    private static TimeOnly ParseTime(string? rawTime)
    {
        if (string.IsNullOrWhiteSpace(rawTime))
        {
            return TimeOnly.MinValue;
        }

        if (!TimeOnly.TryParse(rawTime, out var parsedTime))
        {
            throw new InvalidOperationException("Field 'DueTimeUtc' must be a valid time in HH:mm or HH:mm:ss format.");
        }

        return parsedTime;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void ValidateDefinition(AlertDefinition definition)
    {
        if (definition.Interval < 1)
        {
            throw new InvalidOperationException("Interval must be at least 1.");
        }

        if (definition.LeadTimeDays < 0)
        {
            throw new InvalidOperationException("LeadTimeDays cannot be negative.");
        }

        if (definition.Frequency == AlertRecurrenceType.Weekly && definition.DayOfWeek == null)
        {
            throw new InvalidOperationException("Weekly alerts require DayOfWeek.");
        }

        if (definition.Frequency == AlertRecurrenceType.Monthly && definition.DayOfMonth == null)
        {
            throw new InvalidOperationException("Monthly alerts require DayOfMonth.");
        }

        if (definition.Frequency == AlertRecurrenceType.Yearly && (definition.DayOfMonth == null || definition.MonthOfYear == null))
        {
            throw new InvalidOperationException("Yearly alerts require both DayOfMonth and MonthOfYear.");
        }
    }
}