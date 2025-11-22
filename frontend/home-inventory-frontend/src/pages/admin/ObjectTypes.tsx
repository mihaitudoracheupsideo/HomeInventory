import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { usePageTitle } from "../../contexts/PageTitleContext";
import type { IItemType } from "../../types/IItemType";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  createItemType,
  deleteItemType,
  getItemTypes,
  updateItemType,
} from "../../api/itemTypeService";
import { Label } from "../../components/ui/label";
import { Action } from "../../types/Enums";
import type { Action as ActionType } from "../../types/Enums";

import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Stack } from "@mui/material";
import { Edit, Plus, Save, X, Tag, FileText } from "lucide-react";

const ObjectTypesPage = () => {
  const [types, setTypes] = useState<IItemType[]>([]);
  const [selectedType, setSelectedType] = useState<IItemType | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Tipuri Obiecte");
  }, [setTitle]);

  const columns: GridColDef<IItemType>[] = [
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
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 200,
      renderCell: (params: GridRenderCellParams<IItemType>) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSaveEditPopup(params.row, Action.EDIT)}
            title="Editează"
          >
            ✏️
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

  useEffect(() => {
    // Simulate fetching data from an API
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const res = await getItemTypes();
      const payload = res.data;
      const pagedItems = Array.isArray(payload?.data) ? payload.data : payload;

      if (Array.isArray(pagedItems)) {
        setTypes(pagedItems);
      } else {
        console.error("Unexpected response shape when loading item types", payload);
        setTypes([]);
      }
    } catch (err) {
      console.error("Eroare la preluarea datelor", err);
    }
  };

  const createEmptyType = (): IItemType => ({ id: "", name: "", description: "" });

  const handleSaveEditPopup = (type: IItemType, action: ActionType): void => {
    setSelectedType(type);
    setShowEditDialog(true);
    setIsAdding(action === Action.ADD);
  };

  const handleSaveEdit= async (): Promise<void> => {
    if (selectedType) {
      try {
        if (isAdding) {
          // Add new type - exclude id field
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...typeData } = selectedType;
          await createItemType(typeData);
        } else {
          // Update existing type
          await updateItemType(selectedType.id, selectedType);
        }
        loadTypes();
      } catch (err) {
        console.error("Eroare la actualizare", err);
      }
    }
    setShowEditDialog(false);
  };

  const handleDeletePopup = (type: IItemType): void => {
    setSelectedType(type);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (selectedType) {
      try {
        await deleteItemType(selectedType.id);
        loadTypes();
      } catch (err) {
        console.error("Eroare la ștergere", err);
      }
      setShowDeleteDialog(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tipuri de obiecte</h1>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 pb-4">
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
                  {isAdding ? "Adăugare tip obiect" : "Editare tip obiect"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isAdding ? "Creați un nou tip de obiect" : "Modificați informațiile tipului de obiect"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Nume tip obiect *
              </Label>
              <Input
                id="editName"
                value={selectedType?.name || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  selectedType && setSelectedType({ ...selectedType, name: e.target.value })
                }
                placeholder="Introduceți numele tipului de obiect"
                className="h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                Numele trebuie să fie unic și descriptiv (max. 50 caractere)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Descriere tip obiect
              </Label>
              <Input
                id="editDescription"
                value={selectedType?.description || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  selectedType && setSelectedType({ ...selectedType, description: e.target.value })
                }
                placeholder="Introduceți o descriere opțională"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Descrierea ajută la identificarea tipului de obiect (max. 500 caractere)
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t">
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
              disabled={!selectedType?.name?.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
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
            <div className="rounded-lg bg-muted/50 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm">
                Ești sigur că vrei să ștergi tipul de obiect <strong>"{selectedType?.name}"</strong>?
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Toate obiectele asociate acestui tip vor rămâne fără tip asignat.
              </p>
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
              <X className="h-4 w-4 mr-2" />
              Da, șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Box sx={{ height: 400, width: "100%" }}>
        <Box sx={{ mb: 2 }}>
        <Button
          variant="default"
          onClick={() => {
            handleSaveEditPopup(createEmptyType(), Action.ADD);
          }}
          className="h-11 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adaugă tip obiect
        </Button>
      </Box>
      <DataGrid
        rows={types}
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
}

export default ObjectTypesPage;