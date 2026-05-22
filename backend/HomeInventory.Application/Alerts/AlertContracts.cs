using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Application.Alerts;

public class CreateAlertDefinitionDto
{
    [Required]
    [StringLength(120, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string SourceModule { get; set; } = string.Empty;

    [Required]
    [RegularExpression("Daily|Weekly|Monthly|Yearly")]
    public string Frequency { get; set; } = "Monthly";

    [Range(1, 365)]
    public int Interval { get; set; } = 1;

    [Range(0, 6)]
    public int? DayOfWeek { get; set; }

    [Range(1, 31)]
    public int? DayOfMonth { get; set; }

    [Range(1, 12)]
    public int? MonthOfYear { get; set; }

    [Required]
    public string StartDateUtc { get; set; } = string.Empty;

    public string? DueTimeUtc { get; set; }

    [Range(0, 365)]
    public int LeadTimeDays { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string MessageTemplate { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    [StringLength(4000)]
    public string? MetadataJson { get; set; }

    [StringLength(120)]
    public string? CronExpression { get; set; }
}

public sealed class UpdateAlertDefinitionDto : CreateAlertDefinitionDto
{
}

public sealed record AlertDefinitionDto(
    Guid Id,
    string Name,
    string SourceModule,
    string Frequency,
    int Interval,
    int? DayOfWeek,
    int? DayOfMonth,
    int? MonthOfYear,
    string StartDateUtc,
    string DueTimeUtc,
    int LeadTimeDays,
    string MessageTemplate,
    bool IsEnabled,
    string? MetadataJson,
    string? CronExpression,
    string? NextDueAtUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record AlertOccurrenceDto(
    Guid Id,
    Guid AlertDefinitionId,
    string DefinitionName,
    string SourceModule,
    string Message,
    string Status,
    string PeriodKey,
    DateTime GeneratedAtUtc,
    DateTime ActiveFromUtc,
    DateTime DueAtUtc,
    DateTime? NoticedAtUtc,
    DateTime? SolvedAtUtc,
    bool IsOverdue,
    int DaysOverdue);

public sealed record AlertProcessingResultDto(int CreatedOccurrences, DateTime ProcessedAtUtc);