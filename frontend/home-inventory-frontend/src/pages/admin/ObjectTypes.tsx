import { useEffect, useState } from "react";
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
import { Label } from '../../components/ui/label'
import { Action } from '../../types/Enums'

const ObjectTypesPage = () => {
  const [types, setTypes] = useState<IItemType[]>([]);
  const [selectedType, setSelectedType] = useState<IItemType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Simulate fetching data from an API
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const res = await getItemTypes();
      setTypes(res.data);
    } catch (err) {
      console.error("Eroare la preluarea datelor", err);
    }
  };

  const handleSaveEditPopup = (type: IItemType, action: Action): void => {
    setSelectedType(type);
    setShowEditDialog(true);
    setIsAdding(action === Action.ADD);
  };

  const handleSaveEdit= async (): Promise<void> => {
    if (selectedType) {
      try {
        if (isAdding) {
          // Add new type
          await createItemType(selectedType);
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
      
      {/* Buton Add */}
      <button
        className="mb-4 px-4 py-2 bg-green-600 text-black rounded"
        onClick={() => {
          handleSaveEditPopup({ id: "CA285BA4-925C-4817-9EDE-BB84E76A84CC", name: "", description: "" }, Action.ADD);
        }}
      >
        ➕ Adaugă tip obiect
      </button>

      <table className="w-full bg-white border border-gray-200 shadow rounded-lg">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">Nume</th>
            <th className="p-2 border-b">Descriere</th>
            <th className="p-2 border-b">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {types.map((type) => (
            <tr key={type.id} className="hover:bg-gray-50 text-left">
              <td className="p-2 border-b">{type.name}</td>
              <td className="p-2 border-b">{type.description}</td>
              <td className="p-2 border-b space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleSaveEditPopup(type, Action.EDIT)}>
                  ✏️
                </button>
                <button className="text-red-600 hover:underline" onClick={() => handleDeletePopup(type)}>
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
            <DialogTitle>{isAdding ? "Adaugare tip obiect" : "Editare tip obiect"}</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="block mb-2" htmlFor="editName">Nume tip obiect</Label>
            <Input
              value={selectedType?.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedType && setSelectedType({ ...selectedType, name: e.target.value })}
              placeholder="Nume tip obiect"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editDescription">Descriere tip obiect</Label>
            <Input
              value={selectedType?.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedType && setSelectedType({ ...selectedType, description: e.target.value})}
              placeholder="Descriere tip obiect"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Anulează
            </Button>
            <Button variant="outline" onClick={handleSaveEdit}>
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
          <p>Ești sigur că vrei să ștergi "{selectedType?.name}"?</p>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Nu</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Da, șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ObjectTypesPage;