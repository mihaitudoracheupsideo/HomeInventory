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
  deleteItemType,
  getItemTypes,
  updateItemType,
} from "../../api/itemTypeService";
import { Label } from '../../components/ui/label'

const ObjectTypesPage = () => {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState<IItemType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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

  const handleEdit = (type: IItemType): void => {
    setSelectedType(type);
    setEditName(type.name);
    setEditDescription(type.description);
    setShowEditDialog(true);
  };

  const handleUpdate = async (): Promise<void> => {
    if (selectedType) {
      console.log("Updating type:", selectedType.id, selectedType, editName, editDescription);
      try {
        await updateItemType(selectedType.id, {...selectedType, name: editName, description: editDescription});
        loadTypes();
      } catch (err) {
        console.error("Eroare la actualizare", err);
      }
    }
    setShowEditDialog(false);
  };

  const handleDelete = (type: IItemType): void => {
    setSelectedType(type);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
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
      <table className="min-w-full bg-white border border-gray-200 shadow">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">Nume</th>
            <th className="p-2 border-b">Descriere</th>
            <th className="p-2 border-b">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 text-left">
              <td className="p-2 border-b">{t.name}</td>
              <td className="p-2 border-b">{t.description}</td>
              <td className="p-2 border-b space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleEdit(t)}>
                  Editează
                </button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(t)}>
                  Șterge
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
            <Label className="block mb-2" htmlFor="editName">Nume tip obiect</Label>
            <Input
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditName(e.target.value)
              }
              placeholder="Nume tip obiect"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editDescription">Descriere tip obiect</Label>
            <Input
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditDescription(e.target.value)
              }
              placeholder="Descriere tip obiect"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Anulează
            </Button>
            <Button
              className="ml-2 bg-gray-50"
              variant="default"
              onClick={handleUpdate}
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
          <p>Ești sigur că vrei să ștergi "{selectedType?.name}"?</p>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Nu</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Da, șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ObjectTypesPage;