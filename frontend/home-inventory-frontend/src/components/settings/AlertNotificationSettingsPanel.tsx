import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Box, Button, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getAlertNotificationSettings, sendTestAlertNotificationEmail, updateAlertNotificationSettings } from '../../api/alertNotificationSettingsService';
import type { AlertNotificationSettingsInput } from '../../types/alertNotificationSettings';

const normalizeRecipients = (rawValue: string) => rawValue
  .split(/[,\n]/)
  .map((value) => value.trim())
  .filter(Boolean);

const AlertNotificationSettingsPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['alert-notification-settings'],
    queryFn: getAlertNotificationSettings,
  });

  const [formState, setFormState] = useState<AlertNotificationSettingsInput>({
    emailEnabled: false,
    fromEmail: '',
    fromName: 'HomeInventory Alerts',
    recipients: [],
    smtpHost: '',
    smtpPort: 587,
    smtpEnableSsl: true,
    smtpUsername: '',
    smtpPassword: '',
    clearSmtpPassword: false,
    subjectTemplate: 'New alert: {{AlertName}}',
    htmlTemplate: '',
  });
  const [recipientText, setRecipientText] = useState('');

  useEffect(() => {
    if (!data) {
      return;
    }

    setFormState({
      emailEnabled: data.emailEnabled,
      fromEmail: data.fromEmail ?? '',
      fromName: data.fromName ?? 'HomeInventory Alerts',
      recipients: data.recipients,
      smtpHost: data.smtpHost ?? '',
      smtpPort: data.smtpPort,
      smtpEnableSsl: data.smtpEnableSsl,
      smtpUsername: data.smtpUsername ?? '',
      smtpPassword: '',
      clearSmtpPassword: false,
      subjectTemplate: data.subjectTemplate,
      htmlTemplate: data.htmlTemplate,
    });
    setRecipientText(data.recipients.join('\n'));
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateAlertNotificationSettings,
    onSuccess: (result) => {
      toast.success('Alert notification settings saved.');
      setFormState((current) => ({
        ...current,
        smtpPassword: '',
        clearSmtpPassword: false,
        recipients: result.recipients,
        subjectTemplate: result.subjectTemplate,
        htmlTemplate: result.htmlTemplate,
      }));
      setRecipientText(result.recipients.join('\n'));
    },
    onError: () => {
      toast.error('Failed to save alert notification settings.');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: sendTestAlertNotificationEmail,
    onSuccess: () => {
      toast.success('Test alert email sent.');
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) && typeof error.response?.data === 'string'
        ? error.response.data
        : 'Failed to send test alert email. Save valid SMTP settings first.';
      toast.error(message);
    },
  });

  const recipientCount = useMemo(() => normalizeRecipients(recipientText).length, [recipientText]);

  const handleSave = () => {
    mutation.mutate({
      ...formState,
      recipients: normalizeRecipients(recipientText),
      smtpPassword: formState.smtpPassword?.trim() ? formState.smtpPassword : null,
      fromEmail: formState.fromEmail?.trim() || null,
      fromName: formState.fromName?.trim() || null,
      smtpHost: formState.smtpHost?.trim() || null,
      smtpUsername: formState.smtpUsername?.trim() || null,
      subjectTemplate: formState.subjectTemplate?.trim() || null,
      htmlTemplate: formState.htmlTemplate?.trim() || null,
    });
  };

  if (isLoading) {
    return <Typography variant="body2" color="text.secondary">Loading alert notification settings...</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        SMTP passwords are never returned to the browser. Leave the password field empty to keep the stored password, or enable clear password to remove it.
      </Alert>

      <FormControlLabel
        control={(
          <Switch
            checked={formState.emailEnabled}
            onChange={(event) => setFormState((current) => ({ ...current, emailEnabled: event.target.checked }))}
          />
        )}
        label="Enable email notifications when a new alert occurrence is created"
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <TextField
          label="From email"
          value={formState.fromEmail ?? ''}
          onChange={(event) => setFormState((current) => ({ ...current, fromEmail: event.target.value }))}
          fullWidth
        />
        <TextField
          label="From name"
          value={formState.fromName ?? ''}
          onChange={(event) => setFormState((current) => ({ ...current, fromName: event.target.value }))}
          fullWidth
        />
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Recipients</Typography>
        <TextField
          label="One email per line or comma separated"
          value={recipientText}
          onChange={(event) => setRecipientText(event.target.value)}
          fullWidth
          multiline
          minRows={4}
        />
        <Typography variant="caption" color="text.secondary">
          {recipientCount} recipient{recipientCount === 1 ? '' : 's'} configured
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>SMTP</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TextField
            label="SMTP host"
            value={formState.smtpHost ?? ''}
            onChange={(event) => setFormState((current) => ({ ...current, smtpHost: event.target.value }))}
            fullWidth
          />
          <TextField
            label="SMTP port"
            type="number"
            value={formState.smtpPort}
            onChange={(event) => setFormState((current) => ({ ...current, smtpPort: Number(event.target.value) || 587 }))}
            fullWidth
          />
          <TextField
            label="SMTP username"
            value={formState.smtpUsername ?? ''}
            onChange={(event) => setFormState((current) => ({ ...current, smtpUsername: event.target.value }))}
            fullWidth
          />
          <TextField
            label="SMTP password"
            type="password"
            value={formState.smtpPassword ?? ''}
            onChange={(event) => setFormState((current) => ({ ...current, smtpPassword: event.target.value, clearSmtpPassword: false }))}
            fullWidth
            helperText="Leave empty to keep the stored password."
          />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={(
              <Switch
                checked={formState.smtpEnableSsl}
                onChange={(event) => setFormState((current) => ({ ...current, smtpEnableSsl: event.target.checked }))}
              />
            )}
            label="Use SSL"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={formState.clearSmtpPassword}
                onChange={(event) => setFormState((current) => ({ ...current, clearSmtpPassword: event.target.checked, smtpPassword: event.target.checked ? '' : current.smtpPassword }))}
              />
            )}
            label="Clear stored password"
          />
          {data?.hasSmtpPassword && <Chip size="small" color="success" label="Password stored" />}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Templates</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {'Available placeholders: {{AlertName}}, {{SourceModule}}, {{Message}}, {{GeneratedAtUtc}}, {{ActiveFromUtc}}, {{DueAtUtc}}, {{PeriodKey}}.'}
        </Typography>
        <TextField
          label="Email subject template"
          value={formState.subjectTemplate ?? ''}
          onChange={(event) => setFormState((current) => ({ ...current, subjectTemplate: event.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="HTML email template"
          value={formState.htmlTemplate ?? ''}
          onChange={(event) => setFormState((current) => ({ ...current, htmlTemplate: event.target.value }))}
          fullWidth
          multiline
          minRows={16}
          sx={{ fontFamily: 'Consolas, monospace' }}
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button variant="contained" onClick={handleSave} disabled={mutation.isPending}>
          Save notification settings
        </Button>
        <Button variant="outlined" onClick={() => testEmailMutation.mutate()} disabled={testEmailMutation.isPending}>
          Send test email
        </Button>
        {data?.updatedAtUtc && (
          <Typography variant="caption" color="text.secondary">
            Last updated {new Date(data.updatedAtUtc).toLocaleString()}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default AlertNotificationSettingsPanel;