import { useEffect, useState } from 'react'
import { deleteItem, getItems, updateItem } from '../../api/itemService';
import type { IItem } from '../../types/IItem'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const ObjectsPage = () => {
    const [objects, setObjects] = useState([]);
    const [selectedObject, setSelectedObject] = useState<IItem | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState(""); 

    useEffect(() => {
        // Simulate fetching data from an API
        loadObjects();
    }, []);
    
    const loadObjects = async () => {
        try {
            const res = await getItems();
            setObjects(res.data);
        } catch (err) {
            console.error("Error fetching objects", err);
        }
    };

    const handleEdit = (object: IItem): void => {
        setSelectedObject(object);
        setEditName(object.name);
        setEditDescription(object.description);
        setShowEditDialog(true);
    }

    const handleDelete = (object: IItem): void => {
        setSelectedObject(object);
        setShowDeleteDialog(true);
    }

    const handleUpdate = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
        event.preventDefault();
        if (!selectedObject) return;

        try {
            // Assuming you have an updateItem API function
            // You may need to import it: import { updateItem } from '../../api/itemService';
            const updated = {
                ...selectedObject,
                name: editName,
                description: editDescription,
            };
            await updateItem(updated.id, updated);
            setShowEditDialog(false);
            setSelectedObject(null);
            await loadObjects();
        } catch (err) {
            console.error("Error updating object", err);
        }
    }

    const handleConfirmDelete = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
        event.preventDefault();
        if (!selectedObject) return;

        try {
            // Assuming you have a deleteItem API function
            // You may need to import it: import { deleteItem } from '../../api/itemService';
            await deleteItem(selectedObject.id);
            setShowDeleteDialog(false);
            setSelectedObject(null);
            await loadObjects();
        } catch (err) {
            console.error("Error deleting object", err);
        }
    }

    return (
        <div>
        <h1 className="text-2xl font-bold mb-4">Obiecte</h1>
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
          {objects.map((object:IItem) => (
            <tr key={object.id} className="hover:bg-gray-50 text-left">
              <td className="p-2 border-b">{object.name}</td>
              <td className="p-2 border-b">{object.description}</td>
              <td className="p-2 border-b">{object.itemType.name}</td>
              <td className="p-2 border-b space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleEdit(object)}>
                  Editează
                </button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(object)}>
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
            <Label className="block mb-2" htmlFor="editName">Nume obiect</Label>
            <Input
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditName(e.target.value)
              }
              placeholder="Nume obiect"
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="editDescription">Descriere obiect</Label>
            <Input
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditDescription(e.target.value)
              }
              placeholder="Descriere obiect"
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
          <p>Ești sigur că vrei să ștergi "{selectedObject?.name}"?</p>
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

export default ObjectsPage;
