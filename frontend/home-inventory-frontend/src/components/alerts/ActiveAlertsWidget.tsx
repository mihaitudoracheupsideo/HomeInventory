import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { getActiveAlerts } from '../../api/alertService';
import { AlertCard } from './AlertCard';

export const ActiveAlertsWidget = () => {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', 'active', 4],
    queryFn: () => getActiveAlerts(4),
    staleTime: 60_000,
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Active alerts</h2>
          <p className="mt-1 text-sm text-slate-500">Recurring reminders stay visible here until someone solves them.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/alerts')} className="text-primary-600 hover:text-primary-700">
          View all
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Loading alerts...
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
          <p className="text-base font-medium text-emerald-800">No active alerts.</p>
          <p className="mt-2 text-sm text-emerald-700">When a scheduled reminder becomes active, it will stay here until it is solved.</p>
        </div>
      )}
    </section>
  );
};