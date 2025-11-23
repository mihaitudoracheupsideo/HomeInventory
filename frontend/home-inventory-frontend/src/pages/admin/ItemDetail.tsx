import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import {
  getItem,
  updateItem,
  getItemByUniqueCode,
  getItems,
} from "../../api/itemService";
import { getItemTypes } from "../../api/itemTypeService";
import type { IItem } from "../../types/IItem";
import type { IItemType } from "../../types/IItemType";
import { Input, Textarea } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import LocationPopup from "../../components/LocationPopup";
import LocationHistory from "../../components/LocationHistory";
import LocationHierarchy from "../../components/LocationHierarchy";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, Stack } from "@mui/material";
import {
  Package,
  FileText,
  Tag,
  MapPin,
  Upload,
  Edit,
  Save,
  X,
  ArrowLeft,
  AlertTriangle,
  Archive
} from "lucide-react";

const extractCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const dataProp = (payload as Record<string, unknown>).data ??
      (payload as Record<string, unknown>).Data;
    if (Array.isArray(dataProp)) {
      return dataProp as T[];
    }
  }

  return [];
};

const ItemDetailPage = () => {
  const { id, uniqueCode } = useParams<{ id?: string; uniqueCode?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<IItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);
  const [storedItems, setStoredItems] = useState<IItem[]>([]);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showHierarchyPopup, setShowHierarchyPopup] = useState(false);

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

  const loadItemTypes = useCallback(async () => {
    try {
      const res = await getItemTypes();
      const payload = extractCollection<IItemType>(res.data);
      const isRecognizedShape =
        Array.isArray(res.data) ||
        (res.data &&
          typeof res.data === "object" &&
          ("data" in (res.data as object) || "Data" in (res.data as object)));

      if (isRecognizedShape) {
        setItemTypes(payload);
      } else {
        console.error("Unexpected response shape when loading item types", res.data);
        setItemTypes([]);
      }
    } catch (err) {
      console.error("Error fetching item types", err);
    }
  }, []);

  const loadStoredItems = useCallback(async () => {
    if (!item?.id) return;

    try {
      // Get all items with a large page size to ensure we get all items
      const res = await getItems(''); // Empty search to get all items
      const payload = extractCollection<IItem>(res.data);
      const isRecognizedShape =
        Array.isArray(res.data) ||
        (res.data &&
          typeof res.data === "object" &&
          ("data" in (res.data as object) || "Data" in (res.data as object)));
console.log("isRecognizedShape", isRecognizedShape, payload, res.data)
      if (isRecognizedShape) {
        // Filter items that are stored in this location
        const filteredItems = payload.filter(storedItem => storedItem.currentLocationItemId === item.id);
        console.log("filteredItems", filteredItems)
        setStoredItems(filteredItems);
      } else {
        console.error("Unexpected response shape when loading stored items", res.data);
        setStoredItems([]);
      }
    } catch (err) {
      console.error("Error fetching stored items", err);
      setStoredItems([]);
    }
  }, [item?.id]);

  // Load stored items when item changes
  useEffect(() => {
    if (item?.id) {
      void loadStoredItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const storedItemsColumns: GridColDef<IItem, string>[] = [
    {
      field: "name",
      headerName: "Nume",
      width: 150,
      editable: false,
    },
    {
      field: "description",
      headerName: "Descriere",
      width: 150,
      editable: false,
    },
    {
      field: "itemTypeName",
      headerName: "Tip",
      width: 150,
      valueGetter: (_value, row) => row.itemType?.name ?? "",
    },
    {
      field: "uniqueCode",
      headerName: "Cod unic",
      width: 120,
      valueGetter: (_value, row) => row.uniqueCode ?? "",
    },
    {
      field: "actions",
      headerName: "Acțiuni",
      sortable: false,
      width: 120,
      renderCell: (params: GridRenderCellParams<IItem>) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/objects/${params.row.id}`)}
            title="Vezi detalii"
          >
            👁️
          </Button>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    void loadItem();
    void loadItemTypes();
  }, [loadItem, loadItemTypes]);

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
        <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi
            </Button>
          </div>
        {/* Modern Header with Item Info and QR */}
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/10 dark:to-indigo-950/10 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/30 p-8 mb-8">
          

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            {/* Left side - Item Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                  {item.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-sm">
                    <Tag className="h-4 w-4" />
                    <span className="font-mono text-sm font-medium">{item.uniqueCode}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full shadow-sm">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {item.itemType ? item.itemType.name : 'Tip necunoscut'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - QR Code */}
            <div className="flex flex-col items-center lg:items-end space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                {item.uniqueCode ? (
                  <div className="space-y-3">
                    <QRCodeDisplay
                          value={`${window.location.origin}/item/${item.uniqueCode}`}
                          size={140}
                        />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-2">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <span className="text-sm font-medium text-center">Fără cod QR</span>
                  </div>
                )}
              </div>
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

          {/* Location Block */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center justify-between pb-2 border-b border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Locație</h3>
              </div>
              <div className="flex gap-2">
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHierarchyPopup(true)}
                  title="Arată ierarhia locațiilor"
                  className="p-2"
                >
                  📊
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Location Hierarchy */}
              <LocationHierarchy item={item} />
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

        {/* Stored Items Block */}
        <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200 dark:border-amber-700">
            <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100">Obiecte stocate aici</h3>
            <span className="ml-auto text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded-full">
              {storedItems.length} obiecte
            </span>
          </div>

          <div className="space-y-4">
            {storedItems.length > 0 ? (
              <Box sx={{ height: 300, width: "100%" }}>
                <DataGrid
                  rows={storedItems}
                  columns={storedItemsColumns}
                  pageSizeOptions={[5, 10, 20]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 5, page: 0 },
                    },
                  }}
                  disableRowSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #e5e7eb',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #d1d5db',
                    },
                  }}
                />
              </Box>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">Niciun obiect stocat în această locație</p>
              </div>
            )}
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

        <Dialog open={showHierarchyPopup} onOpenChange={setShowHierarchyPopup}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ierarhia Locațiilor - {item.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Structura ierarhică a locațiilor pentru acest obiect:
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-1">
                  <div className="text-blue-600 dark:text-blue-400 font-semibold">
                    {item.name}
                  </div>
                  {(() => {
                    const renderHierarchy = (currentItem: IItem | null, prefix: string = ""): React.ReactNode[] => {
                      if (!currentItem) return [];
                      
                      const nodes: React.ReactNode[] = [];
                      let item = currentItem.currentLocationItem;
                      let currentPrefix = "  => ";
                      
                      while (item) {
                        nodes.push(
                          <div key={item.id} className="text-green-600 dark:text-green-400">
                            {prefix + currentPrefix + item.name}
                          </div>
                        );
                        item = item.currentLocationItem;
                        currentPrefix = "      => ";
                      }
                      
                      return nodes;
                    };
                    
                    return renderHierarchy(item);
                  })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ItemDetailPage;