import { Button } from '../ui/button';
import type { AlertOccurrence } from '../../types/alerts';

interface AlertCardProps {
  alert: AlertOccurrence;
  onNoticed?: (id: string) => void;
  onSolved?: (id: string) => void;
  onResendEmail?: (id: string) => void;
  compact?: boolean;
}

const statusTone = (alert: AlertOccurrence) => {
  if (alert.isOverdue) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (alert.status === 'Noticed') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (alert.status === 'Solved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const AlertCard = ({ alert, onNoticed, onSolved, onResendEmail, compact = false }: AlertCardProps) => {
  return (
    <article className={`rounded-3xl border p-4 shadow-soft ${statusTone(alert)}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {alert.sourceModule}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {alert.status}
            </span>
            {alert.isOverdue && (
              <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {alert.daysOverdue} day{alert.daysOverdue === 1 ? '' : 's'} overdue
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{alert.definitionName}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{alert.message}</p>
          </div>
          <div className={`grid gap-3 text-sm text-slate-600 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            <div>
              <p className="font-medium text-slate-900">Due</p>
              <p>{formatDate(alert.dueAtUtc)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Active since</p>
              <p>{formatDate(alert.activeFromUtc)}</p>
            </div>
            {!compact && (
              <div>
                <p className="font-medium text-slate-900">Generated</p>
                <p>{formatDate(alert.generatedAtUtc)}</p>
              </div>
            )}
          </div>
        </div>

        {(onNoticed || onSolved || onResendEmail) && alert.status !== 'Solved' && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {onResendEmail && (
              <Button variant="outline" onClick={() => onResendEmail(alert.id)}>
                Resend email
              </Button>
            )}
            {onNoticed && alert.status === 'Active' && (
              <Button variant="outline" onClick={() => onNoticed(alert.id)}>
                Mark noticed
              </Button>
            )}
            {onSolved && (
              <Button onClick={() => onSolved(alert.id)} className="bg-emerald-600 text-white hover:bg-emerald-700">
                Mark solved
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};