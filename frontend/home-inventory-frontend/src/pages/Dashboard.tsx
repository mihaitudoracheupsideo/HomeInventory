import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { usePageTitle } from '../contexts/PageTitleContext';
import StatsCard from '../components/StatsCard';
import ItemCard from '../components/ItemCard';
import { getItems } from '../api/itemService';
import type { IItem } from '../types/IItem';

const Dashboard = () => {
  const [recentItems, setRecentItems] = useState<IItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalBoxes: 0,
    totalLocations: 0,
    recentItemsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Dashboard");
  }, [setTitle]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load recent items
        const itemsResponse = await getItems();
        const items = Array.isArray(itemsResponse.data)
          ? itemsResponse.data.slice(0, 6)
          : itemsResponse.data?.data?.slice(0, 6) || [];

        setRecentItems(items);

        // Calculate stats (in a real app, these would come from dedicated API endpoints)
        setStats({
          totalItems: items.length > 0 ? items.length * 10 : 0, // Mock data
          totalBoxes: 12, // Mock data
          totalLocations: 8, // Mock data
          recentItemsCount: items.length,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your home inventory.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Items"
          value={stats.totalItems}
          icon="📦"
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Boxes"
          value={stats.totalBoxes}
          icon="📦"
          trend={{ value: 5, positive: true }}
        />
        <StatsCard
          title="Locations"
          value={stats.totalLocations}
          icon="📍"
          trend={{ value: 2, positive: false }}
        />
        <StatsCard
          title="Recent Items"
          value={stats.recentItemsCount}
          icon="🆕"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Items</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/objects')}
                className="text-primary-600 hover:text-primary-700"
              >
                <span className="hidden sm:inline">View all →</span>
                <span className="sm:hidden">→</span>
              </Button>
            </div>

            {recentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    className="transform hover:scale-105 transition-transform duration-200"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first item to your inventory.</p>
                <Button
                  onClick={() => navigate('/objects/new')}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Add Your First Item</span>
                  <span className="sm:hidden">Add Item</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/objects/new')}
                className="w-full justify-start bg-primary-50 hover:bg-primary-100 text-primary-700"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white mr-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="hidden sm:inline font-medium">Add New Item</span>
                <span className="sm:hidden font-medium">Add Item</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/boxes/new')}
                className="w-full justify-start bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center text-white mr-3">
                  📦
                </div>
                <span className="hidden sm:inline font-medium">Create Box</span>
                <span className="sm:hidden font-medium">Box</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/locations/new')}
                className="w-full justify-start bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center text-white mr-3">
                  📍
                </div>
                <span className="hidden sm:inline font-medium">Add Location</span>
                <span className="sm:hidden font-medium">Location</span>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Added "Wireless Headphones" to Living Room</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Created new box "Electronics"</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-medium">
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Added location "Garage"</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;