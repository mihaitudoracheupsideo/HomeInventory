import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "../../components/ui/input";
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
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetail(params.row)}
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSaveEditPopup(params.row, Action.EDIT)}
          >
            ✏️
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="error"
            onClick={() => handleDeletePopup(params.row)}
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

  const loadItems = useCallback(async () => {
    try {
      const res = await getItems();
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

  useEffect(() => {
    // Simulate fetching data from an API
    void loadItems();
    void loadItemTypes();
  }, [loadItems, loadItemTypes]);

  const handleSaveEditPopup = (object: IItem, action: ActionType): void => {
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
      await loadItems();
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
      await loadItems();
    } catch (err) {
      console.error("Error deleting object", err);
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Obiecte</h1>

      {/* Buton Add */}
      <button
        className="mb-4 px-4 py-2 bg-green-600 text-black rounded"
        onClick={() => {
          handleSaveEditPopup(createEmptyItem(), Action.ADD);
        }}
      >
        ➕ Adaugă tip obiect
      </button>

      <table className="min-w-full bg-white border border-gray-200 shadow">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">Nume</th>
            <th className="p-2 border-b">Descriere</th>
            <th className="p-2 border-b">Tip</th>
            <th className="p-2 border-b">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: IItem) => (
            <tr key={item.id} className="hover:bg-gray-50 text-left">
              <td className="p-2 border-b">{item.name}</td>
              <td className="p-2 border-b">{item.description}</td>
              <td className="p-2 border-b">{item.itemType?.name}</td>
              <td className="p-2 border-b space-x-2">
                <button
                  className="text-green-600 hover:underline"
                  onClick={() => handleViewDetail(item)}
                >
                  👁️
                </button>
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleSaveEditPopup(item, Action.EDIT)}
                >
                  ✏️
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDeletePopup(item)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editare tip obiect</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="block mb-2" htmlFor="editName">
              Nume obiect
            </Label>
            <Input
              value={selectedItem?.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                selectedItem &&
                setSelectedItem({ ...selectedItem, name: e.target.value })
              }
              placeholder="Nume obiect"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editDescription">
              Descriere obiect
            </Label>
            <Input
              value={selectedItem?.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                selectedItem &&
                setSelectedItem({
                  ...selectedItem,
                  description: e.target.value,
                })
              }
              placeholder="Descriere obiect"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editDescription">
              Tip obiect
            </Label>
            <select
              className="border p-1 w-full"
              value={selectedItem?.itemTypeId ?? ""}
              onChange={(e) =>
                selectedItem &&
                setSelectedItem({ ...selectedItem, itemTypeId: e.target.value })
              }
            >
              <option value="" disabled>
                Selectează un tip
              </option>
              {itemTypes.map((type: IItemType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editTags">
              Tags (separate with commas)
            </Label>
            <Input
              value={selectedItem?.tags?.join(", ") ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                selectedItem &&
                setSelectedItem({
                  ...selectedItem,
                  tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
                })
              }
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editImagePath">
              Image Path
            </Label>
            <Input
              value={selectedItem?.imagePath ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                selectedItem &&
                setSelectedItem({
                  ...selectedItem,
                  imagePath: e.target.value,
                })
              }
              placeholder="path/to/image.jpg"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editImageFile">
              Upload Image
            </Label>
            <div className="mb-2">
              <Label className="text-sm">
                <input
                  type="radio"
                  name="uploadSize"
                  value="original"
                  checked={uploadSize === 'original'}
                  onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                  className="mr-2"
                />
                Original size
              </Label>
              <Label className="text-sm ml-4">
                <input
                  type="radio"
                  name="uploadSize"
                  value="resized"
                  checked={uploadSize === 'resized'}
                  onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                  className="mr-2"
                />
                Resize to fit 800x800 (maintains aspect ratio)
              </Label>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                setSelectedFile(file || null);
              }}
            />
            {isUploading && <p className="text-sm text-blue-600 mt-1">Uploading image...</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Anulează
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveEdit}
            >
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
          </DialogHeader>
          <p>Ești sigur că vrei să ștergi "{selectedItem?.name}"?</p>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Nu</Button>
            </DialogClose>
            <Button variant="outline" onClick={handleDelete}>
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
                src={`http://localhost:5005/api/images/${selectedImageItem.imagePath}`}
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

      <div>MUI DataGrid</div>
      <Box sx={{ height: 400, width: "100%" }}>
        <Box sx={{ mb: 2 }}>
        <Button
          variant="outline"
          onClick={() => {
            handleSaveEditPopup(createEmptyItem(), Action.ADD);
          }}
        >
          Add New
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
