export interface AlertNotificationSettings {
  emailEnabled: boolean;
  fromEmail?: string | null;
  fromName?: string | null;
  recipients: string[];
  smtpHost?: string | null;
  smtpPort: number;
  smtpEnableSsl: boolean;
  smtpUsername?: string | null;
  hasSmtpPassword: boolean;
  subjectTemplate: string;
  htmlTemplate: string;
  updatedAtUtc?: string | null;
}

export interface AlertNotificationSettingsInput {
  emailEnabled: boolean;
  fromEmail?: string | null;
  fromName?: string | null;
  recipients: string[];
  smtpHost?: string | null;
  smtpPort: number;
  smtpEnableSsl: boolean;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  clearSmtpPassword: boolean;
  subjectTemplate?: string | null;
  htmlTemplate?: string | null;
}