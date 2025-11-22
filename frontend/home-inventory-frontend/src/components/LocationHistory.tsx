import { useCallback, useEffect, useState } from "react";
import { getLocationHistory } from "../api/locationService";

interface LocationHistoryProps {
  itemId: string;
}

interface LocationHistoryEntry {
  id: string;
  itemId: string;
  locationItemId: string;
  addedAt: string;
  locationItem: {
    id: string;
    name: string;
    description: string;
    uniqueCode: string;
  };
}

const LocationHistory = ({ itemId }: LocationHistoryProps) => {
  const [history, setHistory] = useState<LocationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const response = await getLocationHistory(itemId);
      setHistory(response.data || []);
    } catch (err) {
      console.error("Error loading location history", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading location history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No location history available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location History</h3>
      <div className="space-y-2">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {index + 1}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {entry.locationItem.name}
                </div>
                <div className="text-sm text-gray-500">
                  {entry.locationItem.uniqueCode}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(entry.addedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationHistory;