using System.Text.Json;
using HomeInventory.Domain.Entities.Alerts;
using HomeInventory.Repository;

namespace HomeInventory.Application.Alerts;

public sealed record AlertNotificationSettingsDto(
    bool EmailEnabled,
    string? FromEmail,
    string? FromName,
    IReadOnlyCollection<string> Recipients,
    string? SmtpHost,
    int SmtpPort,
    bool SmtpEnableSsl,
    string? SmtpUsername,
    bool HasSmtpPassword,
    string SubjectTemplate,
    string HtmlTemplate,
    DateTime? UpdatedAtUtc);

public sealed record ResolvedAlertNotificationSettings(
    bool EmailEnabled,
    string? FromEmail,
    string? FromName,
    IReadOnlyCollection<string> Recipients,
    string? SmtpHost,
    int SmtpPort,
    bool SmtpEnableSsl,
    string? SmtpUsername,
    string? SmtpPassword,
    string SubjectTemplate,
    string HtmlTemplate);

public sealed class UpdateAlertNotificationSettingsDto
{
    public bool EmailEnabled { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
    public List<string> Recipients { get; set; } = new();
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public bool SmtpEnableSsl { get; set; } = true;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool ClearSmtpPassword { get; set; }
    public string? SubjectTemplate { get; set; }
    public string? HtmlTemplate { get; set; }
}

public interface IAlertNotificationSettingsService
{
    Task<AlertNotificationSettingsDto> GetAsync(CancellationToken cancellationToken = default);
    Task<ResolvedAlertNotificationSettings> GetResolvedAsync(CancellationToken cancellationToken = default);
    Task<AlertNotificationSettingsDto> UpdateAsync(UpdateAlertNotificationSettingsDto dto, CancellationToken cancellationToken = default);
}

public sealed class AlertNotificationSettingsService : IAlertNotificationSettingsService
{
    private const string DefaultSubjectTemplate = "New alert: {{AlertName}}";
    private const string DefaultHtmlTemplate = """
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#7f1d1d,#111827);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;">Alert Created</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">{{AlertName}}</h1>
                <p style="margin:10px 0 0;font-size:15px;line-height:1.6;opacity:0.9;">{{Message}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-weight:600;width:180px;">Source module</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">{{SourceModule}}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-weight:600;">Generated at</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">{{GeneratedAtUtc}}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-weight:600;">Active from</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">{{ActiveFromUtc}}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-weight:600;">Due at</td>
                    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">{{DueAtUtc}}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;font-weight:600;">Period key</td>
                    <td style="padding:12px 0 0;">{{PeriodKey}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""";

    private readonly IAlertNotificationSettingsRepository _repository;
    private readonly ISecretProtector _secretProtector;

    public AlertNotificationSettingsService(
        IAlertNotificationSettingsRepository repository,
        ISecretProtector secretProtector)
    {
        _repository = repository;
        _secretProtector = secretProtector;
    }

    public async Task<AlertNotificationSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _repository.GetAsync(cancellationToken);
        return Map(settings);
    }

    public async Task<ResolvedAlertNotificationSettings> GetResolvedAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _repository.GetAsync(cancellationToken);
        return MapResolved(settings);
    }

    public async Task<AlertNotificationSettingsDto> UpdateAsync(UpdateAlertNotificationSettingsDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.SmtpPort <= 0)
        {
            throw new InvalidOperationException("SMTP port must be greater than 0.");
        }

        var settings = await _repository.GetAsync(cancellationToken) ?? new AlertNotificationSettings
        {
            Id = AlertNotificationSettings.SingletonId,
            CreatedAtUtc = DateTime.UtcNow,
        };

        settings.EmailEnabled = dto.EmailEnabled;
        settings.FromEmail = Normalize(dto.FromEmail);
        settings.FromName = Normalize(dto.FromName);
        settings.RecipientsJson = JsonSerializer.Serialize(NormalizeRecipients(dto.Recipients));
        settings.SmtpHost = Normalize(dto.SmtpHost);
        settings.SmtpPort = dto.SmtpPort;
        settings.SmtpEnableSsl = dto.SmtpEnableSsl;
        settings.SmtpUsername = Normalize(dto.SmtpUsername);
        settings.SubjectTemplate = string.IsNullOrWhiteSpace(dto.SubjectTemplate) ? DefaultSubjectTemplate : dto.SubjectTemplate.Trim();
        settings.HtmlTemplate = string.IsNullOrWhiteSpace(dto.HtmlTemplate) ? DefaultHtmlTemplate : dto.HtmlTemplate.Trim();
        settings.UpdatedAtUtc = DateTime.UtcNow;

        if (dto.ClearSmtpPassword)
        {
            settings.SmtpPasswordProtected = null;
        }
        else if (!string.IsNullOrWhiteSpace(dto.SmtpPassword))
        {
            settings.SmtpPasswordProtected = _secretProtector.Protect(dto.SmtpPassword);
        }

        if (settings.CreatedAtUtc == default)
        {
            settings.CreatedAtUtc = DateTime.UtcNow;
        }

        if (await _repository.GetAsync(cancellationToken) == null)
        {
            await _repository.AddAsync(settings, cancellationToken);
        }
        else
        {
            await _repository.UpdateAsync(settings, cancellationToken);
        }

        return Map(settings);
    }

    private AlertNotificationSettingsDto Map(AlertNotificationSettings? settings)
    {
        return new AlertNotificationSettingsDto(
            settings?.EmailEnabled ?? false,
            settings?.FromEmail,
            settings?.FromName,
            DeserializeRecipients(settings?.RecipientsJson),
            settings?.SmtpHost,
            settings?.SmtpPort ?? 587,
            settings?.SmtpEnableSsl ?? true,
            settings?.SmtpUsername,
            !string.IsNullOrWhiteSpace(settings?.SmtpPasswordProtected),
            string.IsNullOrWhiteSpace(settings?.SubjectTemplate) ? DefaultSubjectTemplate : settings.SubjectTemplate,
            string.IsNullOrWhiteSpace(settings?.HtmlTemplate) ? DefaultHtmlTemplate : settings.HtmlTemplate,
            settings?.UpdatedAtUtc);
    }

    private ResolvedAlertNotificationSettings MapResolved(AlertNotificationSettings? settings)
    {
        return new ResolvedAlertNotificationSettings(
            settings?.EmailEnabled ?? false,
            settings?.FromEmail,
            settings?.FromName,
            DeserializeRecipients(settings?.RecipientsJson),
            settings?.SmtpHost,
            settings?.SmtpPort ?? 587,
            settings?.SmtpEnableSsl ?? true,
            settings?.SmtpUsername,
            _secretProtector.Unprotect(settings?.SmtpPasswordProtected),
            string.IsNullOrWhiteSpace(settings?.SubjectTemplate) ? DefaultSubjectTemplate : settings.SubjectTemplate,
            string.IsNullOrWhiteSpace(settings?.HtmlTemplate) ? DefaultHtmlTemplate : settings.HtmlTemplate);
    }

    private static List<string> NormalizeRecipients(IEnumerable<string>? recipients)
    {
        return (recipients ?? Array.Empty<string>())
            .Where(static recipient => !string.IsNullOrWhiteSpace(recipient))
            .Select(static recipient => recipient.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static IReadOnlyCollection<string> DeserializeRecipients(string? recipientsJson)
    {
        if (string.IsNullOrWhiteSpace(recipientsJson))
        {
        return Array.Empty<string>();
        }

      return JsonSerializer.Deserialize<List<string>>(recipientsJson) ?? new List<string>();
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}