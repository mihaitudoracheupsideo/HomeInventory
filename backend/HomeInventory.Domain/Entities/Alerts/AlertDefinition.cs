#nullable enable
using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities.Alerts;

public class AlertDefinition
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string SourceModule { get; set; } = string.Empty;

    public AlertRecurrenceType Frequency { get; set; }

    public int Interval { get; set; } = 1;

    public DayOfWeek? DayOfWeek { get; set; }

    public int? DayOfMonth { get; set; }

    public int? MonthOfYear { get; set; }

    public DateOnly StartDateUtc { get; set; }

    public TimeOnly DueTimeUtc { get; set; } = TimeOnly.MinValue;

    public int LeadTimeDays { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string MessageTemplate { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    [StringLength(4000)]
    public string? MetadataJson { get; set; }

    [StringLength(120)]
    public string? CronExpression { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AlertOccurrence> Occurrences { get; set; } = new List<AlertOccurrence>();
}