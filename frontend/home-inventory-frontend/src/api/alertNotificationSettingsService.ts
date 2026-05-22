import { api } from './api';
import type { AlertNotificationSettings, AlertNotificationSettingsInput } from '../types/alertNotificationSettings';

export const getAlertNotificationSettings = async () => {
  const response = await api.get<AlertNotificationSettings>('/admin/alert-notification-settings');
  return response.data;
};

export const updateAlertNotificationSettings = async (payload: AlertNotificationSettingsInput) => {
  const response = await api.put<AlertNotificationSettings>('/admin/alert-notification-settings', payload);
  return response.data;
};

export const sendTestAlertNotificationEmail = async () => {
  await api.post('/admin/alert-notification-settings/test-email');
};