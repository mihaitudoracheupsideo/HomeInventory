using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using HomeInventory.Application.Alerts;
using HomeInventory.Domain.Entities.Alerts;

namespace HomeInventory.WebApi.Alerts;

public sealed class SmtpAlertNotificationService : IAlertNotificationService
{
    private readonly IAlertNotificationSettingsService _settingsService;
    private readonly ILogger<SmtpAlertNotificationService> _logger;

    public SmtpAlertNotificationService(
        IAlertNotificationSettingsService settingsService,
        ILogger<SmtpAlertNotificationService> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    public async Task NotifyAlertCreatedAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default)
    {
        try
        {
            await SendAlertOccurrenceEmailCoreAsync(occurrence, requireEnabled: true, throwOnFailure: false, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
    }

    public async Task SendAlertOccurrenceEmailAsync(AlertOccurrence occurrence, CancellationToken cancellationToken = default)
    {
        await SendAlertOccurrenceEmailCoreAsync(occurrence, requireEnabled: false, throwOnFailure: true, cancellationToken);
    }

    public async Task SendTestEmailAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var testOccurrence = new AlertOccurrence
        {
            Id = Guid.NewGuid(),
            AlertDefinitionId = Guid.Empty,
            DefinitionNameSnapshot = "SMTP Test",
            SourceModuleSnapshot = "Notifications",
            Message = "This is a test email sent from HomeInventory alert settings.",
            GeneratedAtUtc = nowUtc,
            ActiveFromUtc = nowUtc,
            DueAtUtc = nowUtc,
            PeriodKey = nowUtc.ToString("yyyyMMdd'T'HHmmss"),
            Status = AlertOccurrenceStatus.Active,
            UpdatedAtUtc = nowUtc,
        };

        await SendAlertOccurrenceEmailCoreAsync(testOccurrence, requireEnabled: false, throwOnFailure: true, cancellationToken);
    }

    private async Task SendAlertOccurrenceEmailCoreAsync(
        AlertOccurrence occurrence,
        bool requireEnabled,
        bool throwOnFailure,
        CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetResolvedAsync(cancellationToken);
        if (requireEnabled && !settings.EmailEnabled)
        {
            return;
        }

        if (!HasValidConfiguration(settings, out var reason))
        {
            if (throwOnFailure)
            {
                _logger.LogWarning("Manual alert email send blocked for occurrence {OccurrenceId}: {Reason}", occurrence.Id, reason);
                throw new InvalidOperationException(reason);
            }

            _logger.LogWarning("Alert email notification skipped for occurrence {OccurrenceId}: {Reason}", occurrence.Id, reason);
            return;
        }

        try
        {
            using var message = BuildMessage(settings, occurrence);
            using var client = new SmtpClient(settings.SmtpHost!, settings.SmtpPort)
            {
                EnableSsl = settings.SmtpEnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
            };

            if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
            {
                client.Credentials = new NetworkCredential(settings.SmtpUsername, settings.SmtpPassword);
            }

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, cancellationToken);

            _logger.LogInformation(
                "Alert notification email sent for occurrence {OccurrenceId} to {RecipientCount} recipient(s).",
                occurrence.Id,
                settings.Recipients.Count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (throwOnFailure)
            {
                _logger.LogError(ex, "Manual alert email send failed for occurrence {OccurrenceId}", occurrence.Id);
                throw new InvalidOperationException("Failed to send alert notification email.", ex);
            }

            _logger.LogError(ex, "Failed to send alert notification email for occurrence {OccurrenceId}", occurrence.Id);
        }
    }

    private static bool HasValidConfiguration(ResolvedAlertNotificationSettings settings, out string reason)
    {
        if (string.IsNullOrWhiteSpace(settings.FromEmail))
        {
            reason = "FromEmail is not configured.";
            return false;
        }

        if (settings.Recipients.Count == 0)
        {
            reason = "No recipients are configured.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(settings.SmtpHost))
        {
            reason = "SMTP host is not configured.";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    private static MailMessage BuildMessage(ResolvedAlertNotificationSettings settings, AlertOccurrence occurrence)
    {
        var fromName = string.IsNullOrWhiteSpace(settings.FromName)
            ? settings.FromEmail
            : settings.FromName;

        var message = new MailMessage
        {
            From = new MailAddress(settings.FromEmail!, fromName),
            Subject = RenderTemplate(settings.SubjectTemplate, occurrence),
            Body = BuildPlainTextBody(occurrence),
            IsBodyHtml = false,
        };

        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(
            RenderTemplate(settings.HtmlTemplate, occurrence),
            null,
            MediaTypeNames.Text.Html));

        foreach (var recipient in settings.Recipients.Where(static value => !string.IsNullOrWhiteSpace(value)))
        {
            message.To.Add(recipient);
        }

        return message;
    }

    private static string BuildPlainTextBody(AlertOccurrence occurrence)
    {
        return string.Join(Environment.NewLine, new[]
        {
            "A new alert occurrence has been created.",
            string.Empty,
            $"Alert: {occurrence.DefinitionNameSnapshot}",
            $"Module: {occurrence.SourceModuleSnapshot}",
            $"Message: {occurrence.Message}",
            $"Generated at (UTC): {occurrence.GeneratedAtUtc:O}",
            $"Active from (UTC): {occurrence.ActiveFromUtc:O}",
            $"Due at (UTC): {occurrence.DueAtUtc:O}",
            $"Period key: {occurrence.PeriodKey}",
        });
    }

    private static string RenderTemplate(string template, AlertOccurrence occurrence)
    {
        return template
            .Replace("{{AlertName}}", occurrence.DefinitionNameSnapshot, StringComparison.OrdinalIgnoreCase)
            .Replace("{{SourceModule}}", occurrence.SourceModuleSnapshot, StringComparison.OrdinalIgnoreCase)
            .Replace("{{Message}}", occurrence.Message, StringComparison.OrdinalIgnoreCase)
            .Replace("{{GeneratedAtUtc}}", occurrence.GeneratedAtUtc.ToString("O"), StringComparison.OrdinalIgnoreCase)
            .Replace("{{ActiveFromUtc}}", occurrence.ActiveFromUtc.ToString("O"), StringComparison.OrdinalIgnoreCase)
            .Replace("{{DueAtUtc}}", occurrence.DueAtUtc.ToString("O"), StringComparison.OrdinalIgnoreCase)
            .Replace("{{PeriodKey}}", occurrence.PeriodKey, StringComparison.OrdinalIgnoreCase);
    }
}