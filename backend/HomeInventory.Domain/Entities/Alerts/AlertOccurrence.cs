#nullable enable
using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities.Alerts;

public class AlertOccurrence
{
    public Guid Id { get; set; }

    public Guid AlertDefinitionId { get; set; }

    public AlertDefinition AlertDefinition { get; set; } = null!;

    [Required]
    [StringLength(40)]
    public string PeriodKey { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string DefinitionNameSnapshot { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string SourceModuleSnapshot { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    public AlertOccurrenceStatus Status { get; set; } = AlertOccurrenceStatus.Active;

    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ActiveFromUtc { get; set; }

    public DateTime DueAtUtc { get; set; }

    public DateTime? NoticedAtUtc { get; set; }

    public DateTime? SolvedAtUtc { get; set; }

    [StringLength(4000)]
    public string? PayloadJson { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}