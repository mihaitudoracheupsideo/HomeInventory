import { useCallback, useEffect, useState } from "react";
import { getLocationHistory } from "../api/locationService";
import { MapPinned, MoveRight } from "lucide-react";

interface LocationHistoryProps {
  itemId: string;
}

interface LocationHistoryEntry {
  id: string;
  itemId: string;
  locationItemId: string;
  addedAt: string;
  endedAt?: string | null;
  current: boolean;
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
      <div className="flex items-center justify-center py-8 text-sm text-slate-500">
        Se încarcă istoricul locațiilor...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
        Nu există încă istoric pentru această locație.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">Istoric locații</h3>
      <div className="space-y-2">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-slate-900">
                      {entry.locationItem.name}
                    </div>
                    {entry.current && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Curentă
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {entry.locationItem.uniqueCode}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{new Date(entry.addedAt).toLocaleString("ro-RO")}</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>
                      {entry.endedAt
                        ? new Date(entry.endedAt).toLocaleString("ro-RO")
                        : "prezent"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-400">
                #{index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationHistory;