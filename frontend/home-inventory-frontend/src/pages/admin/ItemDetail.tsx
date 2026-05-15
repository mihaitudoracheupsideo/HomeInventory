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
import {
  assignTagsToItem,
  getItemTags,
  removeTagFromItem,
} from "../../api/tagService";
import { API_BASE_URL } from "../../api/api";
import type { IItem } from "../../types/IItem";
import type { ITag } from "../../types/ITag";
import { Input, Textarea } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import LocationPopup from "../../components/LocationPopup";
import LocationHistory from "../../components/LocationHistory";
import LocationHierarchy from "../../components/LocationHierarchy";
import TagInput from "../../components/TagInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
  type GridRowSelectionModel,
  type MuiEvent,
} from "@mui/x-data-grid";
import { Box } from "@mui/material";
import {
  Package,
  Tag,
  MapPin,
  Upload,
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
  const [storedItems, setStoredItems] = useState<IItem[]>([]);
  const [itemTags, setItemTags] = useState<ITag[]>([]);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showHierarchyPopup, setShowHierarchyPopup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Selection state
  const [selectedStoredItems, setSelectedStoredItems] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  const [storedItemsPaginationModel, setStoredItemsPaginationModel] = useState({ pageSize: 5, page: 0 });
  const selectedStoredItemIds = Array.from(selectedStoredItems.ids) as string[];

  const loadItem = useCallback(async () => {
    const itemId = id || uniqueCode;
    if (!itemId) return;

    try {
      const res = id ? await getItem(itemId) : await getItemByUniqueCode(uniqueCode!);
      const loadedItem = res.data as IItem;
      setItem(loadedItem);

      if (loadedItem.id) {
        const tagsResponse = await getItemTags(loadedItem.id);
        const loadedTags = tagsResponse.data ?? [];
        setItemTags(loadedTags);
        setItem((currentItem) => currentItem ? { ...currentItem, tags: loadedTags.map((tag) => tag.name) } : currentItem);
      }
    } catch (err) {
      console.error("Error fetching item", err);
    } finally {
      setLoading(false);
    }
  }, [id, uniqueCode]);

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

      if (isRecognizedShape) {
        // Filter items that are stored in this location
        const filteredItems = payload.filter(storedItem => storedItem.parentItemId === item.id);
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
  ];

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const handleStoredItemRowClick = (params: GridRowParams<IItem>, event: MuiEvent<React.MouseEvent>) => {
    if (event.ctrlKey || event.metaKey) {
      // Navigate to item details when CTRL is pressed
      navigate(`/objects/${params.id}`);
    }
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedStoredItemIds.length === 0) return;

    try {
      // Update each selected item to set ParentItemId to null
      const updatePromises = selectedStoredItemIds.map(itemId =>
        updateItem(itemId, { parentItemId: undefined } as Partial<IItem>)
      );

      await Promise.all(updatePromises);

      // Clear selection and refresh stored items
      setSelectedStoredItems({ type: "include", ids: new Set() });
      setShowDeleteConfirmation(false);
      void loadStoredItems();

      toast.success(`${selectedStoredItemIds.length} obiecte au fost eliminate din container`);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Eroare la eliminarea obiectelor');
    }
  };

  const handleSave = async () => {
    if (!item) return;

    setSaving(true);
    try {
      const tagIdsByName = new Map(itemTags.map((tag) => [tag.name.toLocaleUpperCase(), tag.id]));
      const nextTagNames = item.tags ?? [];
      const currentTagNames = itemTags.map((tag) => tag.name);

      const tagsToAdd = nextTagNames.filter(
        (tagName) => !currentTagNames.some((existingTagName) => existingTagName.toLocaleUpperCase() === tagName.toLocaleUpperCase())
      );
      const tagsToRemove = itemTags.filter(
        (tag) => !nextTagNames.some((tagName) => tagName.toLocaleUpperCase() === tag.name.toLocaleUpperCase())
      );

      await updateItem(item.id, {
        id: item.id,
        name: item.name,
        description: item.description,
        itemTypeId: item.itemTypeId,
        uniqueCode: item.uniqueCode,
        imagePath: item.imagePath,
        parentItemId: item.parentItemId,
      });

      if (tagsToAdd.length > 0) {
        await assignTagsToItem(item.id, tagsToAdd);
      }

      await Promise.all(
        tagsToRemove.map((tag) => removeTagFromItem(item.id, tag.id ?? tagIdsByName.get(tag.name.toLocaleUpperCase()) ?? ''))
      );

      const refreshedTagsResponse = await getItemTags(item.id);
      const refreshedTags = refreshedTagsResponse.data ?? [];
      setItemTags(refreshedTags);
      setItem((currentItem) => currentItem ? { ...currentItem, tags: refreshedTags.map((tag) => tag.name) } : currentItem);

      toast.success("Obiectul a fost salvat cu succes!");
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


          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-8 items-start">
            {/* Left side - Image */}
            <div className="flex-shrink-0">
              {item.imagePath ? (
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors bg-white"
                  onClick={() => setShowImageModal(true)}
                  title="Click pentru a vedea imaginea mai mare"
                >
                  <img
                    src={`${API_BASE_URL}/api/images/${item.imagePath}?t=${Date.now()}`}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded-md">
                            No Image
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div
                  className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white"
                  onClick={() => setShowImageModal(true)}
                  title="Click pentru a adăuga o imagine"
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <div className="text-xs">Fără imagine</div>
                    <div className="text-xs mt-0.5">Click pentru a adăuga</div>
                  </div>
                </div>
              )}
            </div>

            {/* Middle - Item Information */}
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
            <div className="flex-shrink-0">
              {item.uniqueCode ? (
                <QRCodeDisplay
                      value={`${window.location.origin}/item/${item.uniqueCode}`}
                      size={140}
                    />
              ) : (
                <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <span className="text-sm font-medium text-center">Fără cod QR</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information Block */}
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-700">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Informații de bază</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                {/* Name and Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName" className="flex items-center gap-2 text-sm font-medium">
                      Nume
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemDescription" className="flex items-center gap-2 text-sm font-medium">
                      Descriere
                    </Label>
                    <div className="flex items-start gap-2">
                      <Textarea
                        id="itemDescription"
                        value={item.description || ""}
                        onChange={(e) => setItem({ ...item, description: e.target.value })}
                        className="flex-1 min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
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
                Etichete
              </Label>
              <TagInput
                value={item.tags ?? []}
                label="Etichete"
                placeholder="Alege un tag existent sau creează unul nou"
                helperText="Tag-urile se salvează împreună cu modificările obiectului."
                disabled={saving}
                onChange={(nextTags) => {
                  setItem({
                    ...item,
                    tags: nextTags,
                  });
                }}
              />
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
              {selectedStoredItemIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="ml-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Elimină ({selectedStoredItemIds.length})
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <Box sx={{ height: 300, width: "100%" }}>
                <DataGrid
                  rows={storedItems}
                  columns={storedItemsColumns}
                  pageSizeOptions={[5, 10, 20]}
                  paginationModel={storedItemsPaginationModel}
                  onPaginationModelChange={setStoredItemsPaginationModel}
                  checkboxSelection
                  rowSelectionModel={selectedStoredItems}
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectedStoredItems(newSelection);
                  }}
                  onRowClick={handleStoredItemRowClick}
                  slots={{
                    noRowsOverlay: () => (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <Archive className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">Niciun obiect stocat în această locație</p>
                      </div>
                    ),
                  }}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #e5e7eb',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #d1d5db',
                    },
                    '& .MuiDataGrid-row:hover': {
                      cursor: 'pointer',
                    },
                  }}
                />
              </Box>
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
          item={item}
          onItemUpdated={(updatedItem) => {
            setItem(updatedItem);
            // Also update the stored items if this item is in the stored items list
            setStoredItems(prev => prev.map(storedItem => 
              storedItem.id === updatedItem.id ? updatedItem : storedItem
            ));
          }}
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
                      let item = currentItem.parent;
                      let currentPrefix = "  => ";
                      
                      while (item) {
                        nodes.push(
                          <div key={item.id} className="text-green-600 dark:text-green-400">
                            {prefix + currentPrefix + item.name}
                          </div>
                        );
                        item = item.parent;
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

        <ImagePreviewModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          item={item}
          onItemUpdated={(updatedItem) => {
            setItem(updatedItem);
            // Also update the stored items if this item is in the stored items list
            setStoredItems(prev => prev.map(storedItem => 
              storedItem.id === updatedItem.id ? updatedItem : storedItem
            ));
          }}
        />

        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                    Confirmare eliminare
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Această acțiune nu poate fi anulată
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Eliminare obiecte din container
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Vrei să elimini {selectedStoredItemIds.length} obiecte din acest container? Obiectele vor fi scoase din locația curentă.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmation(false)}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Nu, anulează
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelectedItems}
                className="flex-1 sm:flex-none"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Da, elimină
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ItemDetailPage;