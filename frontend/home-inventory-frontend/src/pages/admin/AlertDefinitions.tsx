import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getAlertDefinitions, createAlertDefinition, updateAlertDefinition } from '../../api/alertService';
import { usePageTitle } from '../../contexts/PageTitleContext';
import type { AlertDefinition, AlertDefinitionInput } from '../../types/alerts';

const emptyDefinition = (): AlertDefinitionInput => ({
  name: '',
  sourceModule: '',
  frequency: 'Monthly',
  interval: 1,
  dayOfWeek: 1,
  dayOfMonth: 1,
  monthOfYear: 1,
  startDateUtc: new Date().toISOString().slice(0, 10),
  dueTimeUtc: '09:00:00',
  leadTimeDays: 0,
  messageTemplate: '',
  isEnabled: true,
  metadataJson: '',
  cronExpression: '',
});

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const toNullableNumber = (value: string) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapDefinitionToInput = (definition: AlertDefinition): AlertDefinitionInput => ({
  name: definition.name,
  sourceModule: definition.sourceModule,
  frequency: definition.frequency,
  interval: definition.interval,
  dayOfWeek: definition.dayOfWeek ?? null,
  dayOfMonth: definition.dayOfMonth ?? null,
  monthOfYear: definition.monthOfYear ?? null,
  startDateUtc: definition.startDateUtc,
  dueTimeUtc: definition.dueTimeUtc,
  leadTimeDays: definition.leadTimeDays,
  messageTemplate: definition.messageTemplate,
  isEnabled: definition.isEnabled,
  metadataJson: definition.metadataJson ?? '',
  cronExpression: definition.cronExpression ?? '',
});

const AlertDefinitionsPage = () => {
  const { setTitle } = usePageTitle();
  const queryClient = useQueryClient();
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AlertDefinitionInput>(emptyDefinition());

  useEffect(() => {
    setTitle('Alert Definitions');
  }, [setTitle]);

  const { data: definitions, isLoading } = useQuery({
    queryKey: ['alerts', 'definitions'],
    queryFn: getAlertDefinitions,
  });

  const selectedDefinition = useMemo(
    () => definitions?.find((definition) => definition.id === selectedDefinitionId) ?? null,
    [definitions, selectedDefinitionId],
  );

  useEffect(() => {
    if (selectedDefinition) {
      setFormState(mapDefinitionToInput(selectedDefinition));
      return;
    }

    setFormState(emptyDefinition());
  }, [selectedDefinition]);

  const refreshDefinitions = async () => {
    await queryClient.invalidateQueries({ queryKey: ['alerts', 'definitions'] });
    await queryClient.invalidateQueries({ queryKey: ['alerts', 'active'] });
  };

  const createMutation = useMutation({
    mutationFn: createAlertDefinition,
    onSuccess: async (definition) => {
      toast.success('Alert definition created.');
      setSelectedDefinitionId(definition.id);
      await refreshDefinitions();
    },
    onError: () => {
      toast.error('Failed to create alert definition.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AlertDefinitionInput }) => updateAlertDefinition(id, payload),
    onSuccess: async () => {
      toast.success('Alert definition updated.');
      await refreshDefinitions();
    },
    onError: () => {
      toast.error('Failed to update alert definition.');
    },
  });

  const handleSubmit = async () => {
    if (selectedDefinitionId) {
      updateMutation.mutate({ id: selectedDefinitionId, payload: formState });
      return;
    }

    createMutation.mutate(formState);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Reusable alert definitions</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-500">
              Definitions configure recurrence and message templates. Users never act on definitions directly; the scheduler turns them into occurrences.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDefinitionId(null);
              setFormState(emptyDefinition());
            }}
          >
            New definition
          </Button>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_1.3fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Definition catalog</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a definition to edit or create a new reusable rule.</p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Loading definitions...
            </div>
          ) : definitions && definitions.length > 0 ? (
            <div className="space-y-3">
              {definitions.map((definition) => (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => setSelectedDefinitionId(definition.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedDefinitionId === definition.id ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{definition.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{definition.sourceModule} • {definition.frequency} every {definition.interval}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${definition.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {definition.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{definition.messageTemplate}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Next due: {definition.nextDueAtUtc ? new Date(definition.nextDueAtUtc).toLocaleString() : 'Not scheduled'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No alert definitions yet.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">{selectedDefinition ? 'Edit definition' : 'Create definition'}</h2>
            <p className="mt-1 text-sm text-slate-500">This form stays generic so the module can be extracted and reused by other applications later.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Name</span>
              <Input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} placeholder="Replace water filter" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Source module</span>
              <Input value={formState.sourceModule} onChange={(event) => setFormState((current) => ({ ...current, sourceModule: event.target.value }))} placeholder="Maintenance" />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Frequency</span>
              <select
                value={formState.frequency}
                onChange={(event) => setFormState((current) => ({ ...current, frequency: event.target.value as AlertDefinition['frequency'] }))}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Interval</span>
              <Input type="number" min={1} value={formState.interval} onChange={(event) => setFormState((current) => ({ ...current, interval: Number(event.target.value) || 1 }))} />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Start date (UTC)</span>
              <Input type="date" value={formState.startDateUtc} onChange={(event) => setFormState((current) => ({ ...current, startDateUtc: event.target.value }))} />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Due time (UTC)</span>
              <Input type="time" value={(formState.dueTimeUtc ?? '09:00:00').slice(0, 5)} onChange={(event) => setFormState((current) => ({ ...current, dueTimeUtc: `${event.target.value}:00` }))} />
            </label>

            {formState.frequency === 'Weekly' && (
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>Day of week</span>
                <select
                  value={formState.dayOfWeek ?? ''}
                  onChange={(event) => setFormState((current) => ({ ...current, dayOfWeek: toNullableNumber(event.target.value) }))}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  {dayOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}

            {(formState.frequency === 'Monthly' || formState.frequency === 'Yearly') && (
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Day of month</span>
                <Input type="number" min={1} max={31} value={formState.dayOfMonth ?? ''} onChange={(event) => setFormState((current) => ({ ...current, dayOfMonth: toNullableNumber(event.target.value) }))} />
              </label>
            )}

            {formState.frequency === 'Yearly' && (
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Month of year</span>
                <select
                  value={formState.monthOfYear ?? ''}
                  onChange={(event) => setFormState((current) => ({ ...current, monthOfYear: toNullableNumber(event.target.value) }))}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Lead time days</span>
              <Input type="number" min={0} value={formState.leadTimeDays} onChange={(event) => setFormState((current) => ({ ...current, leadTimeDays: Number(event.target.value) || 0 }))} />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={formState.isEnabled} onChange={(event) => setFormState((current) => ({ ...current, isEnabled: event.target.checked }))} />
              Enabled
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Message template</span>
              <textarea
                value={formState.messageTemplate}
                onChange={(event) => setFormState((current) => ({ ...current, messageTemplate: event.target.value }))}
                placeholder="Reminder: {{AlertName}} from {{SourceModule}} is due."
                className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Metadata JSON</span>
              <textarea
                value={formState.metadataJson ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, metadataJson: event.target.value }))}
                placeholder='{"emailTemplate":"maintenance-default"}'
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Future cron expression</span>
              <Input value={formState.cronExpression ?? ''} onChange={(event) => setFormState((current) => ({ ...current, cronExpression: event.target.value }))} placeholder="Reserved for future cron-based schedules" />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Button onClick={handleSubmit} disabled={!formState.name.trim() || !formState.sourceModule.trim() || !formState.messageTemplate.trim()}>
              {selectedDefinition ? 'Save changes' : 'Create definition'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDefinitionId(null);
                setFormState(emptyDefinition());
              }}
            >
              Reset form
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AlertDefinitionsPage;