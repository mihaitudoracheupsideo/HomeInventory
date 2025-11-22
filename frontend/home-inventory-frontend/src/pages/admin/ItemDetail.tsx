import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import {
  getItem,
  updateItem,
  getItemByUniqueCode,
} from "../../api/itemService";
import type { IItem } from "../../types/IItem";
import { Input, Textarea } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import LocationPopup from "../../components/LocationPopup";
import LocationHistory from "../../components/LocationHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Package,
  FileText,
  Tag,
  MapPin,
  Upload,
  Edit,
  Save,
  X
} from "lucide-react";

const ItemDetailPage = () => {
  const { id, uniqueCode } = useParams<{ id?: string; uniqueCode?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<IItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);

  const loadItem = useCallback(async () => {
    const itemId = id || uniqueCode;
    if (!itemId) return;

    try {
      const res = id ? await getItem(itemId) : await getItemByUniqueCode(uniqueCode!);
      setItem(res.data);
    } catch (err) {
      console.error("Error fetching item", err);
    } finally {
      setLoading(false);
    }
  }, [id, uniqueCode]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const handleSave = async () => {
    if (!item) return;

    setSaving(true);
    try {
      await updateItem(item.id, item);
      toast.success("Obiectul a fost salvat cu succes!");
      // Reset all editing states
      setEditingName(false);
      setEditingDescription(false);
      setEditingTags(false);
      navigate("/objects");
    } catch (err: unknown) {
      console.error("Error updating item", err);
      let errorMessage = "A apărut o eroare la salvarea obiectului.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: string } };
        errorMessage = axiosError.response?.data || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/objects");
  };

  const handleLocationChanged = () => {
    // Reload item data to reflect location changes
    void loadItem();
  };

  const handleNavigateToLocation = () => {
    if (item?.currentLocationItem) {
      navigate(`/objects/${item.currentLocationItem.id}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg text-red-600">Item not found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
              <p className="inline-block bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-700">{item.uniqueCode}</p>
            </div>
            <div>
              {item.uniqueCode ? (
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <QRCodeDisplay
                    value={`${window.location.origin}/item/${item.uniqueCode}`}
                    size={120}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  No QR Code
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Block */}
            <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-700">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Informații de bază</h3>
              </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                {/* Left side - Name and Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName" className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Nume obiect
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="itemName"
                        value={item.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setItem({ ...item, name: e.target.value })
                        }
                        className="flex-1 h-11"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingName(!editingName)}
                        className="p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemDescription" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Descriere obiect
                    </Label>
                    <div className="flex items-start gap-2">
                      <Textarea
                        id="itemDescription"
                        value={item.description || ""}
                        onChange={(e) => setItem({ ...item, description: e.target.value })}
                        className="flex-1 min-h-[80px] resize-none"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingDescription(!editingDescription)}
                        className="p-2 mt-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right side - Image */}
                <div className="space-y-4">
                  {item.imagePath ? (
                    <div className="space-y-3">
                      <div
                        className="w-full max-w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors mx-auto"
                        onClick={() => setShowImageModal(true)}
                      >
                        <img
                          src={`http://localhost:5005/api/images/${item.imagePath}?t=${Date.now()}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                                  No Image
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                        onClick={() => {
                          // TODO: Implement image replacement
                          toast.error("Funcționalitatea de înlocuire imagine va fi implementată");
                        }}
                          className="px-4"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Înlocuiește imaginea
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-48 h-48 rounded-lg bg-gray-100 border-2 border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm mx-auto">
                      <div className="mb-2">No Image</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement image upload
                          toast.error("Funcționalitatea de încărcare imagine va fi implementată");
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Adaugă imagine
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Type and Location Block */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center gap-2 pb-2 border-b border-green-200 dark:border-green-700">
              <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Clasificare și locație</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Locație curentă
                  </Label>
                  <div className="text-gray-900 font-medium">
                    {item.currentLocationItem ? (
                      <span>
                        {item.currentLocationItem.name} ({item.currentLocationItem.uniqueCode})
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">Fără locație asignată</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowLocationPopup(true)}
                    title="Management locație"
                    className="p-2"
                  >
                    🔍
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistoryPopup(true)}
                    title="Istoric locație"
                    className="p-2"
                  >
                    📋
                  </Button>
                  {item.currentLocationItem && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleNavigateToLocation}
                      title="Mergi la locație"
                      className="p-2"
                    >
                      ➡️
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags Block */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-700">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100">Etichete și căutare</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemTags" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Etichete (separate prin virgulă sau spațiu)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="itemTags"
                  value={item.tags?.join(", ") || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setItem({
                      ...item,
                      tags: e.target.value.split(/[,\s]+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
                    })
                  }
                  className="flex-1 h-11"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTags(!editingTags)}
                  className="p-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="px-6"
          >
            <X className="h-4 w-4 mr-2" />
            Anulează
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Se salvează..." : "Salvează modificările"}
          </Button>
        </div>

        {/* Modals */}
        <ImagePreviewModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imagePath={item.imagePath || ""}
          itemName={item.name}
        />

        <LocationPopup
          isOpen={showLocationPopup}
          onClose={() => setShowLocationPopup(false)}
          item={item}
          onLocationChanged={handleLocationChanged}
        />

        <Dialog open={showHistoryPopup} onOpenChange={setShowHistoryPopup}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Istoric Locație - {item.name}</DialogTitle>
            </DialogHeader>
            <LocationHistory itemId={item.id} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ItemDetailPage;