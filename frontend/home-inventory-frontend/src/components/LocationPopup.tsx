import { useCallback, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { IItem } from "../types/IItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { searchItems, setCurrentLocation } from "../api/locationService";
import LocationHistory from "./LocationHistory";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

interface LocationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  item: IItem;
  onLocationChanged: () => void;
}

const LocationPopup = ({ isOpen, onClose, item, onLocationChanged }: LocationPopupProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchItems(searchTerm);
      const results = Array.isArray(response.data) ? response.data :
                     response.data?.data || response.data?.Data || [];
      setSearchResults(results);
      setShowResults(true);
      setMessage(null);
    } catch (err) {
      console.error("Error searching items", err);
      setMessage({ type: 'error', text: 'Eroare la căutarea articolelor' });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  const handleSetLocation = async (locationItem: IItem) => {
    if (!confirm(`Setați locația curentă a "${item.name}" la "${locationItem.name}"?`)) {
      return;
    }

    try {
      await setCurrentLocation(item.id, locationItem.id);
      setMessage({
        type: 'success',
        text: `Articolul "${item.name}" a fost setat la locația "${locationItem.name}"`
      });
      setShowResults(false);
      onLocationChanged();
    } catch (err) {
      console.error("Error setting location", err);
      setMessage({ type: 'error', text: 'Eroare la setarea locației' });
    }
  };

  const handleMoveToLocation = async (locationItem: IItem) => {
    if (!confirm(`Mutați articolul "${item.name}" la locația "${locationItem.name}"?`)) {
      return;
    }

    try {
      await setCurrentLocation(item.id, locationItem.id);
      setMessage({
        type: 'success',
        text: `Articolul "${item.name}" a fost mutat la locația "${locationItem.name}"`
      });
      setShowResults(false);
      onLocationChanged();
    } catch (err) {
      console.error("Error moving item", err);
      setMessage({ type: 'error', text: 'Eroare la mutarea articolului' });
    }
  };

  const columns: GridColDef<IItem, string>[] = [
    {
      field: "name",
      headerName: "Nume",
      width: 200,
    },
    {
      field: "description",
      headerName: "Descriere",
      width: 200,
    },
    {
      field: "uniqueCode",
      headerName: "Cod Unic",
      width: 120,
    },
    {
      field: "actions",
      headerName: "Acțiuni",
      sortable: false,
      width: 150,
      renderCell: (params: GridRenderCellParams<IItem>) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSetLocation(params.row)}
            title="Setează ca locație curentă"
          >
            📍
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMoveToLocation(params.row)}
            title="Mută articolul aici"
          >
            📦
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Management Locație - {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Location Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Locație Curentă</h3>
            {item.currentLocationItem ? (
              <div className="text-blue-800">
                <div className="font-medium">{item.currentLocationItem.name}</div>
                <div className="text-sm">{item.currentLocationItem.uniqueCode}</div>
                {item.currentLocationItem.description && (
                  <div className="text-sm mt-1">{item.currentLocationItem.description}</div>
                )}
              </div>
            ) : (
              <div className="text-blue-700 italic">Fără locație asignată</div>
            )}
          </div>

          {/* Location History */}
          <LocationHistory itemId={item.id} />

          {/* Search Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Caută Locație Nouă</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Caută după nume, descriere sau tag-uri..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
              >
                {isSearching ? "Caută..." : "🔍 Caută"}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Rezultate Căutare</h3>
              <div style={{ height: 300, width: '100%' }}>
                <DataGrid
                  rows={searchResults}
                  columns={columns}
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 5, page: 0 },
                    },
                  }}
                  disableRowSelectionOnClick
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPopup;