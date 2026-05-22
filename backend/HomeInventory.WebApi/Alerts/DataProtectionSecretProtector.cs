using HomeInventory.Application.Alerts;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Cryptography;

namespace HomeInventory.WebApi.Alerts;

public sealed class DataProtectionSecretProtector : ISecretProtector
{
    private readonly IDataProtector _dataProtector;
    private readonly ILogger<DataProtectionSecretProtector> _logger;

    public DataProtectionSecretProtector(
        IDataProtectionProvider dataProtectionProvider,
        ILogger<DataProtectionSecretProtector> logger)
    {
        _dataProtector = dataProtectionProvider.CreateProtector("HomeInventory.Alerts.NotificationSecrets.v1");
        _logger = logger;
    }

    public string Protect(string plainText)
    {
        return _dataProtector.Protect(plainText);
    }

    public string? Unprotect(string? protectedText)
    {
        if (string.IsNullOrWhiteSpace(protectedText))
        {
            return null;
        }

        try
        {
            return _dataProtector.Unprotect(protectedText);
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Stored SMTP password could not be decrypted with the current data protection key ring.");
            throw new InvalidOperationException("The stored SMTP password can no longer be decrypted. Enter the SMTP app password again and save the notification settings.", ex);
        }
    }
}