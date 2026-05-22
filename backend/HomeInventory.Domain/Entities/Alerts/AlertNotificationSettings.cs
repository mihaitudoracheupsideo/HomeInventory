#nullable enable
using System.ComponentModel.DataAnnotations;

namespace HomeInventory.Domain.Entities.Alerts;

public class AlertNotificationSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public bool EmailEnabled { get; set; }

    [StringLength(256)]
    public string? FromEmail { get; set; }

    [StringLength(120)]
    public string? FromName { get; set; }

    [StringLength(4000)]
    public string RecipientsJson { get; set; } = "[]";

    [StringLength(256)]
    public string? SmtpHost { get; set; }

    public int SmtpPort { get; set; } = 587;

    public bool SmtpEnableSsl { get; set; } = true;

    [StringLength(256)]
    public string? SmtpUsername { get; set; }

    [StringLength(4000)]
    public string? SmtpPasswordProtected { get; set; }

    [StringLength(200)]
    public string SubjectTemplate { get; set; } = string.Empty;

    [StringLength(12000)]
    public string HtmlTemplate { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}