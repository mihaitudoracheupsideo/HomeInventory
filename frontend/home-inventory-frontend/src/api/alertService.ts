import { api } from './api';
import type { AlertDefinition, AlertDefinitionInput, AlertOccurrence } from '../types/alerts';

export const getActiveAlerts = async (take?: number) => {
  const response = await api.get<AlertOccurrence[]>('/alerts/active', {
    params: typeof take === 'number' ? { take } : undefined,
  });

  return response.data;
};

export const getAlertHistory = async (take = 50) => {
  const response = await api.get<AlertOccurrence[]>('/alerts/history', {
    params: { take },
  });

  return response.data;
};

export const markAlertAsNoticed = async (id: string) => {
  const response = await api.post<AlertOccurrence>(`/alerts/${id}/noticed`);
  return response.data;
};

export const markAlertAsSolved = async (id: string) => {
  const response = await api.post<AlertOccurrence>(`/alerts/${id}/solved`);
  return response.data;
};

export const resendAlertEmail = async (id: string) => {
  const response = await api.post<AlertOccurrence>(`/alerts/${id}/resend-email`);
  return response.data;
};

export const getAlertDefinitions = async () => {
  const response = await api.get<AlertDefinition[]>('/admin/alert-definitions');
  return response.data;
};

export const createAlertDefinition = async (payload: AlertDefinitionInput) => {
  const response = await api.post<AlertDefinition>('/admin/alert-definitions', payload);
  return response.data;
};

export const updateAlertDefinition = async (id: string, payload: AlertDefinitionInput) => {
  const response = await api.put<AlertDefinition>(`/admin/alert-definitions/${id}`, payload);
  return response.data;
};