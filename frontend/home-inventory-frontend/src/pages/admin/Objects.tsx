import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../contexts/PageTitleContext";
import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from "../../api/itemService";
import { uploadImage } from "../../api/imageService";
import type { IItem } from "../../types/IItem";
import type { IItemType } from "../../types/IItemType";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input, Textarea } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { getItemTypes } from "../../api/itemTypeService";
import { Action } from "../../types/Enums";
import type { Action as ActionType } from "../../types/Enums";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, Stack } from "@mui/material";
import {
  Edit,
  Plus,
  Save,
  X,
  Package,
  FileText,
  Tag,
  MapPin,
  Image as ImageIcon,
  Upload,
  AlertCircle
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

const ObjectsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTitle } = usePageTitle();
  const [items, setItems] = useState<IItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImageItem, setSelectedImageItem] = useState<IItem | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSize, setUploadSize] = useState<'original' | 'resized'>('original');

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  // Set page title
  useEffect(() => {
    setTitle("Obiecte");
  }, [setTitle]);

  const columns: GridColDef<IItem, string>[] = [
    {
      field: "name",
      headerName: "Nume",
      width: 150,
      editable: true,
    },
    {
      field: "description",
      headerName: "Descriere",
      width: 150,
      editable: true,
    },
    {
      field: "itemTypeName",
      headerName: "Tip",
      width: 150,
      valueGetter: (_value, row) => row.itemType?.name ?? "",
    },
    {
      field: "currentLocation",
      headerName: "Locație",
      width: 200,
      valueGetter: (_value, row) => 
        row.currentLocationItem ? `${row.currentLocationItem.name} (${row.currentLocationItem.uniqueCode})` : "Fără locație",
    },
    {
      field: "image",
      headerName: "Imagine",
      sortable: false,
      width: 100,
      renderCell: (params: GridRenderCellParams<IItem>) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewImage(params.row)}
          disabled={!params.row.imagePath}
          title={params.row.imagePath ? "Vezi imaginea" : "Nicio imagine"}
        >
          🖼️
        </Button>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 200,
      renderCell: (params: GridRenderCellParams<IItem>) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetail(params.row)}
            title="Vezi detalii"
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleSaveEditPopup(params.row, Action.EDIT)}
            title="Editează"
          >
            ✏️ {params.row.name} {params.row.itemTypeId}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeletePopup(params.row)}
            title="Șterge"
          >
            🗑️
          </Button>
        </Stack>
      ),
    },
  ];

  const createEmptyItem = (): IItem => ({
    id: "",
    name: "",
    description: "",
    itemTypeId: itemTypes.length > 0 ? itemTypes[0].id : "",
    tags: [],
    imagePath: "",
  });

  const loadItems = useCallback(async (search?: string) => {
    try {
      const res = await getItems(search);
      const payload = extractCollection<IItem>(res.data);
      const isRecognizedShape =
        Array.isArray(res.data) ||
        (res.data &&
          typeof res.data === "object" &&
          ("data" in (res.data as object) || "Data" in (res.data as object)));

      if (isRecognizedShape) {
        setItems(payload);
      } else {
        console.error("Unexpected response shape when loading items", res.data);
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching objects", err);
    }
  }, []);

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
      console.error("Error fetching objects", err);
    }
  }, []);

  // Read search query from URL parameters
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      setSearchInput(query);
    }
  }, [searchParams]);

  useEffect(() => {
    // Simulate fetching data from an API
    void loadItems(searchTerm);
    void loadItemTypes();
  }, [loadItems, loadItemTypes, searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const handleSaveEditPopup = async (object: IItem, action: ActionType): Promise<void> => {
    // Ensure item types are loaded before opening the dialog
    if (itemTypes.length === 0) {
      try {
        await loadItemTypes();
      } catch (error) {
        console.error("Failed to load item types:", error);
      }
    }

    setSelectedItem(action === Action.ADD ? createEmptyItem() : object);
    setSelectedFile(null);
    setUploadSize('original');
    setShowEditDialog(true);
    setIsAdding(action === Action.ADD);
  };

  const handleViewDetail = (item: IItem): void => {
    navigate(`/objects/${item.id}`);
  };

  const handleViewImage = (item: IItem): void => {
    setSelectedImageItem(item);
    setShowImageDialog(true);
  };

  const handleDeletePopup = (object: IItem): void => {
    setSelectedItem(object);
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedItem) return;

    // Validate required fields
    if (!selectedItem.name?.trim()) {
      alert("Name is required");
      return;
    }
    if (!selectedItem.itemTypeId || selectedItem.itemTypeId === "") {
      alert("Item type is required");
      return;
    }

    try {
      // Upload image if a file is selected
      if (selectedFile && selectedItem.uniqueCode) {
        setIsUploading(true);
        try {
          const uploadParams: { maxWidth?: number; maxHeight?: number } = {};
          if (uploadSize === 'resized') {
            uploadParams.maxWidth = 800;
            uploadParams.maxHeight = 800;
          }
          const uploadResponse = await uploadImage(selectedFile, selectedItem.uniqueCode, uploadParams.maxWidth, uploadParams.maxHeight);
          selectedItem.imagePath = uploadResponse.data.imagePath;
        } catch (uploadError) {
          console.error("Error uploading image", uploadError);
          alert("Failed to upload image. Please try again.");
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      console.log("Sending item data:", selectedItem);
      if (isAdding) {
        // Add new item - exclude id and itemType fields
        const itemData = {
          name: selectedItem.name,
          description: selectedItem.description,
          itemTypeId: selectedItem.itemTypeId,
          tags: selectedItem.tags,
          imagePath: selectedItem.imagePath,
          currentLocationItemId: selectedItem.currentLocationItemId,
        };
        await createItem(itemData);
      } else {
        // update item - only send the fields that can be updated
        const updateData = {
          name: selectedItem.name,
          description: selectedItem.description || null,
          itemTypeId: selectedItem.itemTypeId,
          tags: selectedItem.tags || [],
          imagePath: selectedItem.imagePath || null,
        };
        await updateItem(selectedItem.id, updateData);
      }
      setShowEditDialog(false);
      setSelectedItem(null);
      setSelectedFile(null);
      setSelectedFile(null);
      await loadItems(searchTerm);
    } catch (err) {
      console.error("Error updating object", err);
      const error = err as { response?: { data?: unknown } };
      console.error("Error details:", error?.response?.data);
      alert(`Error: ${error?.response?.data || 'Unknown error'}`);
    }
  };

  const handleDelete = async (
    event: MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!selectedItem) return;

    try {
      // Assuming you have a deleteItem API function
      // You may need to import it: import { deleteItem } from '../../api/itemService';
      await deleteItem(selectedItem.id);
      setShowDeleteDialog(false);
      setSelectedItem(null);
      await loadItems(searchTerm);
    } catch (err) {
      console.error("Error deleting object", err);
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Obiecte</h1>

      {/* Search Input */}
      <div className="mb-4 flex gap-2 items-center">
        <Input
          type="text"
          placeholder="Caută obiecte... (nume, descriere, tag-uri, tip)"
          value={searchInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch}>
          <span className="hidden sm:inline">🔍 Caută</span>
          <span className="sm:hidden">🔍</span>
        </Button>
        <Button variant="outline" onClick={handleClearSearch}>
          <span className="hidden sm:inline">❌ Șterge căutarea</span>
          <span className="sm:hidden">❌</span>
        </Button>
      </div>

      

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                {isAdding ? (
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {isAdding ? "Adăugare obiect" : "Editare obiect"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isAdding ? "Creați un nou obiect în inventar" : "Modificați informațiile obiectului"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information Block */}
            <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-700">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Informații de bază</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName" className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Nume obiect *
                  </Label>
                  <Input
                    id="editName"
                    value={selectedItem?.name || ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      selectedItem && setSelectedItem({ ...selectedItem, name: e.target.value })
                    }
                    placeholder="Introduceți numele obiectului"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDescription" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descriere obiect
                  </Label>
                  <Textarea
                    id="editDescription"
                    value={selectedItem?.description || ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      selectedItem && setSelectedItem({ ...selectedItem, description: e.target.value })
                    }
                    placeholder="Introduceți o descriere opțională"
                    className="min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Type and Location Block */}
            <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2 pb-2 border-b border-green-200 dark:border-green-700">
                <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Clasificare și locație</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editItemType" className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Tip obiect *
                  </Label>
                  <select
                    key={selectedItem?.id || 'new'}
                    id="editItemType"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedItem?.itemTypeId || ""}
                    onChange={(e) => {
                      if (selectedItem) {
                        setSelectedItem({ ...selectedItem, itemTypeId: e.target.value });
                      }
                    }}
                    disabled={itemTypes.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {itemTypes.length === 0 ? "Se încarcă tipurile de obiect..." : "Selectează un tip de obiect"}
                    </option>
                    {itemTypes.map((type: IItemType) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                    {/* Show current value if it's not in the options */}
                    {selectedItem?.itemTypeId && !itemTypes.some(type => type.id === selectedItem.itemTypeId) && (
                      <option value={selectedItem.itemTypeId}>
                        Tip necunoscut ({selectedItem.itemTypeId})
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editLocation" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Locație curentă
                  </Label>
                  <select
                    id="editLocation"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedItem?.currentLocationItemId ?? ""}
                    onChange={(e) =>
                      selectedItem && setSelectedItem({ ...selectedItem, currentLocationItemId: e.target.value || undefined })
                    }
                  >
                    <option value="">
                      Fără locație specificată
                    </option>
                    {items
                      .filter(item => item.id !== selectedItem?.id)
                      .map((item: IItem) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.uniqueCode})
                        </option>
                      ))}
                  </select>
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
                <Label htmlFor="editTags" className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Etichete (separate prin virgulă sau spațiu)
                </Label>
                <Input
                  id="editTags"
                  value={selectedItem?.tags?.join(", ") ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    selectedItem && setSelectedItem({
                      ...selectedItem,
                      tags: e.target.value.split(/[,\s]+/).map(tag => tag.trim()).filter(tag => tag.length > 0),
                    })
                  }
                  placeholder="ex: electronic birou, important"
                  className="h-11"
                />
              </div>
            </div>

            {/* Image Block */}
            <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-800/50">
              <div className="flex items-center gap-2 pb-2 border-b border-orange-200 dark:border-orange-700">
                <ImageIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-medium text-orange-900 dark:text-orange-100">Imagine</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editImagePath" className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Cale imagine existentă
                  </Label>
                  <Input
                    id="editImagePath"
                    value={selectedItem?.imagePath ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      selectedItem && setSelectedItem({
                        ...selectedItem,
                        imagePath: e.target.value,
                      })
                    }
                    placeholder="path/to/image.jpg"
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Încărcare imagine nouă
                  </Label>

                  <div className="space-y-3 p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-4">
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="uploadSize"
                          value="original"
                          checked={uploadSize === 'original'}
                          onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                          className="text-primary"
                        />
                        <span className="text-sm">Dimensiune originală</span>
                      </Label>
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="uploadSize"
                          value="resized"
                          checked={uploadSize === 'resized'}
                          onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                          className="text-primary"
                        />
                        <span className="text-sm">Redimensionare la 800x800px</span>
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Input
                        id="editImageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          setSelectedFile(file || null);
                        }}
                        className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Fișier selectat: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    {isUploading && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">Se încarcă imaginea...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Anulează
            </Button>
            <Button
              variant="default"
              onClick={handleSaveEdit}
              className="flex-1 sm:flex-none"
              disabled={!selectedItem?.name?.trim() || !selectedItem?.itemTypeId || isUploading}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvează {selectedItem?.itemTypeId} {selectedItem?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                  Confirmare ștergere
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
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Ștergere obiect: "{selectedItem?.name}"
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Ești sigur că vrei să ștergi acest obiect? Toate informațiile asociate vor fi pierdute permanent.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 sm:flex-none">
                <X className="h-4 w-4 mr-2" />
                Nu, anulează
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 sm:flex-none"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Da, șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Imagine: {selectedImageItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedImageItem?.imagePath ? (
              <img
                src={`http://localhost:5005/api/images/${selectedImageItem.imagePath}?t=${Date.now()}`}
                alt={selectedImageItem.name}
                className="max-w-full max-h-96 object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-gray-500 text-center">Imaginea nu a putut fi încărcată</p>';
                  }
                }}
              />
            ) : (
              <p className="text-gray-500">Nicio imagine disponibilă</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Box sx={{ height: 400, width: "100%" }}>
        <Box sx={{ mb: 2 }}>
        <Button
          variant="default"
          onClick={() => {
            void handleSaveEditPopup(createEmptyItem(), Action.ADD);
          }}
          className="h-11 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adaugă obiect
        </Button>
      </Box>
      <DataGrid
        rows={items}
        columns={columns}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        checkboxSelection // bife pentru selectie
        disableRowSelectionOnClick
      />
    </Box>
    </div>
  );
};

export default ObjectsPage;
