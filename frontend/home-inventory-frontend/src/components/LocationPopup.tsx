import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { IItem } from "../types/IItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { searchItems, setCurrentLocation } from "../api/locationService";
import LocationHistory from "./LocationHistory";
import { ArrowRightLeft, Edit3, Loader2, MapPinned, Search, X } from "lucide-react";

interface LocationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  item: IItem;
  onLocationChanged: () => void;
}

const LocationPopup = ({ isOpen, onClose, item, onLocationChanged }: LocationPopupProps) => {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<IItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentLocationLabel = item.parent
    ? `${item.parent.name}${item.parent.uniqueCode ? ` (${item.parent.uniqueCode})` : ""}`
    : "fără locație";

  useEffect(() => {
    if (!isOpen) {
      setIsEditingLocation(false);
      setSearchTerm("");
      setSearchResults([]);
      setSelectedLocation(null);
      setMessage(null);
      setIsSearching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isEditingLocation) {
      return;
    }

    const normalizedTerm = searchTerm.trim();
    if (normalizedTerm.length < 3) {
      setSearchResults([]);
      setSelectedLocation(null);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const runSearch = async () => {
        setIsSearching(true);
        try {
          const response = await searchItems(normalizedTerm);
          const rawResults = Array.isArray(response.data)
            ? response.data
            : response.data?.data ?? response.data?.Data ?? [];

          const nextResults = (Array.isArray(rawResults) ? rawResults : []).filter(
            (candidate: IItem) => candidate.id !== item.id
          );

          setSearchResults(nextResults);
          setSelectedLocation((currentSelection) =>
            nextResults.some((candidate: IItem) => candidate.id === currentSelection?.id)
              ? currentSelection
              : null
          );
          setMessage(null);
        } catch (err) {
          console.error("Error searching items", err);
          setSearchResults([]);
          setSelectedLocation(null);
          setMessage({ type: 'error', text: 'Eroare la căutarea locațiilor.' });
        } finally {
          setIsSearching(false);
        }
      };

      void runSearch();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isEditingLocation, isOpen, item.id, searchTerm]);

  const canMoveToSelection = Boolean(
    selectedLocation && selectedLocation.id !== item.parentItemId
  );

  const helperMessage = useMemo(() => {
    if (!isEditingLocation) {
      return null;
    }

    if (searchTerm.trim().length === 0) {
      return "Scrie numele locației. Căutarea pornește de la al treilea caracter.";
    }

    if (searchTerm.trim().length < 3) {
      return "Mai introdu cel puțin un caracter pentru a căuta.";
    }

    if (isSearching) {
      return "Căutăm locațiile disponibile...";
    }

    if (searchResults.length === 0) {
      return "Nu am găsit nicio locație pentru textul introdus.";
    }

    return "Selectează noua locație din lista de mai jos.";
  }, [isEditingLocation, isSearching, searchResults.length, searchTerm]);

  const handleMove = async () => {
    if (!selectedLocation || !canMoveToSelection) {
      return;
    }

    const confirmed = window.confirm(
      `Esti sigur ca vrei sa muti obiectul ${item.name} din ${currentLocationLabel} in ${selectedLocation.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await setCurrentLocation(item.id, selectedLocation.id);
      setMessage({
        type: 'success',
        text: `Obiectul "${item.name}" a fost mutat în "${selectedLocation.name}".`
      });
      setIsEditingLocation(false);
      setSearchTerm("");
      setSearchResults([]);
      setSelectedLocation(null);
      onLocationChanged();
    } catch (err) {
      console.error("Error moving item", err);
      setMessage({ type: 'error', text: 'Eroare la mutarea obiectului.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Management Locație - {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#f0f9ff_45%,#ecfeff_100%)] p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
                  <MapPinned className="h-4 w-4" />
                  Locație curentă
                </div>
                {item.parent ? (
                  <div className="space-y-1 text-slate-800">
                    <div className="text-lg font-semibold">{item.parent.name}</div>
                    <div className="text-sm text-slate-500">{item.parent.uniqueCode}</div>
                    {item.parent.description && (
                      <div className="max-w-2xl text-sm text-slate-600">{item.parent.description}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm italic text-slate-600">Obiectul nu are încă o locație setată.</div>
                )}
              </div>

              <Button
                type="button"
                variant={isEditingLocation ? "secondary" : "outline"}
                onClick={() => {
                  setIsEditingLocation((current) => !current);
                  setSearchTerm("");
                  setSearchResults([]);
                  setSelectedLocation(null);
                  setMessage(null);
                }}
                className="gap-2 self-start"
              >
                {isEditingLocation ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditingLocation ? "Renunță" : "Editează"}
              </Button>
            </div>

            {isEditingLocation && (
              <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Scrie noua locație..."
                      value={searchTerm}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                      className="pl-9"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>

                  {helperMessage && (
                    <div className="text-sm text-slate-500">{helperMessage}</div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {searchResults.map((result) => {
                        const isSelected = selectedLocation?.id === result.id;

                        return (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => setSelectedLocation(result)}
                            className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "border-sky-300 bg-sky-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <div className="font-medium text-slate-900">{result.name}</div>
                              <div className="text-sm text-slate-500">{result.uniqueCode ?? "Fără cod"}</div>
                              {result.description && (
                                <div className="mt-1 text-sm text-slate-600">{result.description}</div>
                              )}
                            </div>
                            {isSelected && (
                              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
                                Selectată
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedLocation && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                          Locație nouă selectată
                        </div>
                        <div className="mt-1 font-semibold text-slate-900">{selectedLocation.name}</div>
                        <div className="text-sm text-slate-500">{selectedLocation.uniqueCode ?? "Fără cod"}</div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => void handleMove()}
                        disabled={!canMoveToSelection}
                        className="gap-2 self-start lg:self-auto"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Setează ca părinte nou
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <LocationHistory itemId={item.id} />

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