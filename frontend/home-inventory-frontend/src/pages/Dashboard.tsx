import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ActiveAlertsWidget } from '../components/alerts/ActiveAlertsWidget';
import { usePageTitle } from '../contexts/PageTitleContext';
import { getDashboardStats } from '../api/dashboardService';

interface DashboardItemSummary {
  id: string;
  name: string;
  uniqueCode?: string;
  addedAt?: string;
  updatedAt?: string;
  itemType?: string;
}

interface DashboardStats {
  totalItems: number;
  totalContainers: number;
  rootItems: number;
  itemsWithoutParent: number;
  itemsByType: Record<string, number>;
  recentItems: DashboardItemSummary[];
  recentlyScanned: DashboardItemSummary[];
}

const emptyStats: DashboardStats = {
  totalItems: 0,
  totalContainers: 0,
  rootItems: 0,
  itemsWithoutParent: 0,
  itemsByType: {},
  recentItems: [],
  recentlyScanned: [],
};

const formatAbsoluteDate = (value?: string) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatRelativeDate = (value?: string) => {
  if (!value) {
    return 'Unknown time';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return `${absMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);

  if (absHours < 24) {
    return `${absHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);

  if (absDays < 7) {
    return `${absDays}d ago`;
  }

  return formatAbsoluteDate(value);
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Dashboard');
  }, [setTitle]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await getDashboardStats();
        setStats({
          ...emptyStats,
          ...response.data,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats(emptyStats);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const topItemTypes = useMemo(
    () => Object.entries(stats.itemsByType).sort(([, left], [, right]) => right - left),
    [stats.itemsByType],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-soft lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Inventory overview</p>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">See what changed recently and where your inventory is growing.</h1>
            <p className="max-w-2xl text-sm text-slate-300 lg:text-base">
              {stats.totalItems} total items across {Object.keys(stats.itemsByType).length} item types. {stats.recentItems.length} most recent additions are ready below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/mobile/add-item')} className="bg-white text-slate-900 hover:bg-slate-100">
              Add Item
            </Button>
            <Button variant="outline" onClick={() => navigate('/objects')} className="border-slate-500 bg-transparent text-white hover:bg-slate-800 hover:text-white">
              Browse Items
            </Button>
            <Button variant="outline" onClick={() => navigate('/search')} className="border-slate-500 bg-transparent text-white hover:bg-slate-800 hover:text-white">
              Search Inventory
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Total items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalItems}</p>
          <p className="mt-2 text-sm text-slate-600">Everything currently tracked in the inventory.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Containers</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalContainers}</p>
          <p className="mt-2 text-sm text-slate-600">Boxes or items that can hold other items.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Root items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.rootItems}</p>
          <p className="mt-2 text-sm text-slate-600">Items stored at the top level with no parent item.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Unplaced items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.itemsWithoutParent}</p>
          <p className="mt-2 text-sm text-slate-600">Standalone items that still need a container or location.</p>
        </div>
      </section>

      <ActiveAlertsWidget />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Last 10 items added</h2>
              <p className="mt-1 text-sm text-slate-500">Newest additions, ordered by added date.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/objects')} className="text-primary-600 hover:text-primary-700">
              View all
            </Button>
          </div>

          {stats.recentItems.length > 0 ? (
            <div className="space-y-3">
              {stats.recentItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/objects/${item.id}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-primary-300 hover:bg-primary-50/50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.itemType ?? 'Unknown type'}
                          {item.uniqueCode ? ` • ${item.uniqueCode}` : ''}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{formatRelativeDate(item.addedAt)}</p>
                        <p>{formatAbsoluteDate(item.addedAt)}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-medium text-slate-900">No items have been added yet.</p>
              <p className="mt-2 text-sm text-slate-500">Start adding inventory and this section will show the latest 10 items.</p>
              <Button onClick={() => navigate('/mobile/add-item')} className="mt-6">
                Add the first item
              </Button>
            </div>
          )}
        </section>

        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Items by type</h2>
                <p className="mt-1 text-sm text-slate-500">Quick breakdown of where your inventory is concentrated.</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/object-types')} className="text-primary-600 hover:text-primary-700">
                Manage types
              </Button>
            </div>

            {topItemTypes.length > 0 ? (
              <div className="space-y-3">
                {topItemTypes.map(([typeName, count]) => {
                  const percentage = stats.totalItems > 0 ? Math.round((count / stats.totalItems) * 100) : 0;

                  return (
                    <div key={typeName} className="rounded-2xl border border-slate-200 px-4 py-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{count} items in {typeName}</p>
                          <p className="text-sm text-slate-500">{percentage}% of tracked inventory</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-slate-800" style={{ width: `${Math.max(percentage, count > 0 ? 6 : 0)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No item type distribution is available yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Recently updated</h2>
            <p className="mt-1 text-sm text-slate-500">Most recently touched items, based on update time.</p>

            {stats.recentlyScanned.length > 0 ? (
              <div className="mt-5 space-y-3">
                {stats.recentlyScanned.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/objects/${item.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-primary-300 hover:bg-primary-50/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.itemType ?? 'Unknown type'}
                        {item.uniqueCode ? ` • ${item.uniqueCode}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm text-slate-500">
                      <p>{formatRelativeDate(item.updatedAt)}</p>
                      <p>{formatAbsoluteDate(item.updatedAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No recent updates have been recorded yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button variant="outline" onClick={() => navigate('/mobile/add-item')} className="justify-start">
                Add new item
              </Button>
              <Button variant="outline" onClick={() => navigate('/objects')} className="justify-start">
                Review all items
              </Button>
              <Button variant="outline" onClick={() => navigate('/search')} className="justify-start">
                Search by code or tag
              </Button>
              <Button variant="outline" onClick={() => navigate('/object-types')} className="justify-start">
                Review item types
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;