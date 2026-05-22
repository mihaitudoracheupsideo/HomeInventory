export interface AlertOccurrence {
  id: string;
  alertDefinitionId: string;
  definitionName: string;
  sourceModule: string;
  message: string;
  status: 'Active' | 'Noticed' | 'Solved';
  periodKey: string;
  generatedAtUtc: string;
  activeFromUtc: string;
  dueAtUtc: string;
  noticedAtUtc?: string | null;
  solvedAtUtc?: string | null;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface AlertDefinition {
  id: string;
  name: string;
  sourceModule: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  interval: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
  startDateUtc: string;
  dueTimeUtc: string;
  leadTimeDays: number;
  messageTemplate: string;
  isEnabled: boolean;
  metadataJson?: string | null;
  cronExpression?: string | null;
  nextDueAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface AlertDefinitionInput {
  name: string;
  sourceModule: string;
  frequency: AlertDefinition['frequency'];
  interval: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
  startDateUtc: string;
  dueTimeUtc?: string | null;
  leadTimeDays: number;
  messageTemplate: string;
  isEnabled: boolean;
  metadataJson?: string | null;
  cronExpression?: string | null;
}