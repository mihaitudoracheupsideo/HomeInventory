import { useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveAlerts, getAlertHistory, markAlertAsNoticed, markAlertAsSolved, resendAlertEmail } from '../api/alertService';
import { AlertCard } from '../components/alerts/AlertCard';
import { usePageTitle } from '../contexts/PageTitleContext';

const AlertsPage = () => {
  const { setTitle } = usePageTitle();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTitle('Alerts');
  }, [setTitle]);

  const { data: activeAlerts, isLoading: activeLoading } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: () => getActiveAlerts(),
    staleTime: 30_000,
  });

  const { data: historyAlerts, isLoading: historyLoading } = useQuery({
    queryKey: ['alerts', 'history'],
    queryFn: () => getAlertHistory(40),
  });

  const refreshAlerts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const noticedMutation = useMutation({
    mutationFn: markAlertAsNoticed,
    onSuccess: async () => {
      toast.success('Alert marked as noticed.');
      await refreshAlerts();
    },
    onError: () => {
      toast.error('Failed to mark alert as noticed.');
    },
  });

  const solvedMutation = useMutation({
    mutationFn: markAlertAsSolved,
    onSuccess: async () => {
      toast.success('Alert solved.');
      await refreshAlerts();
    },
    onError: () => {
      toast.error('Failed to solve alert.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendAlertEmail,
    onSuccess: () => {
      toast.success('Alert email resent.');
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) && typeof error.response?.data === 'string'
        ? error.response.data
        : 'Failed to resend alert email.';
      toast.error(message);
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-red-950 via-slate-900 to-slate-800 p-6 text-white shadow-soft lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">Alerts</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">Recurring reminders that stay actionable until solved.</h1>
            <p className="mt-3 text-sm text-slate-300 lg:text-base">
              Active occurrences represent concrete work. Definitions only configure schedules and message templates.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p><span className="font-semibold text-white">{activeAlerts?.length ?? 0}</span> unresolved alerts</p>
            <p><span className="font-semibold text-white">{historyAlerts?.filter((alert) => alert.status === 'Solved').length ?? 0}</span> solved in recent history</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Active alerts</h2>
          <p className="mt-1 text-sm text-slate-500">These remain on the dashboard until someone solves them.</p>
        </div>

        {activeLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Loading active alerts...
          </div>
        ) : activeAlerts && activeAlerts.length > 0 ? (
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResendEmail={(id) => resendMutation.mutate(id)}
                onNoticed={(id) => noticedMutation.mutate(id)}
                onSolved={(id) => solvedMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
            <p className="text-lg font-medium text-emerald-900">No active alerts right now.</p>
            <p className="mt-2 text-sm text-emerald-700">New occurrences will appear automatically when their schedules become active.</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Recent history</h2>
          <p className="mt-1 text-sm text-slate-500">Solved alerts disappear from the active dashboard but remain in the module history.</p>
        </div>

        {historyLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Loading history...
          </div>
        ) : historyAlerts && historyAlerts.length > 0 ? (
          <div className="space-y-4">
            {historyAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No alert history yet.
          </div>
        )}
      </section>
    </div>
  );
};

export default AlertsPage;