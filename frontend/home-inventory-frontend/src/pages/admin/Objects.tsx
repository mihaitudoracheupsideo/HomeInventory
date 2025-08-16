import { useEffect, useState } from "react";
import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from "../../api/itemService";
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
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

const ObjectsPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [itemTypes, setItemTypes] = useState([]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isAdding, setIsAdding] = useState(false);

  

  useEffect(() => {
    // Simulate fetching data from an API
    loadItems();
    loadItemTypes();
  }, []);

  const loadItems = async () => {
    try {
      const res = await getItems();
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching objects", err);
    }
  };

  const loadItemTypes = async () => {
    try {
      const res = await getItemTypes();
      setItemTypes(res.data);
    } catch (err) {
      console.error("Error fetching objects", err);
    }
  };

  const handleSaveEditPopup = (object: IItem, action: Action): void => {
    setSelectedItem(object);
    setShowEditDialog(true);
    setIsAdding(action === Action.ADD);
  };

  const handleDeletePopup = (object: IItem): void => {
    setSelectedItem(object);
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedItem) return;
    try {
      if (isAdding) {
        // Add new item
        await createItem(selectedItem);
      } else {
        // update item
        await updateItem(selectedItem.id, selectedItem);
      }
      setShowEditDialog(false);
      setSelectedItem(null);
      await loadItems();
    } catch (err) {
      console.error("Error updating object", err);
    }
  };

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
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
          handleSaveEditPopup(
            {
              id: "CA285BA4-925C-4817-9EDE-BB84E76A84CC",
              name: "",
              description: "",
              itemTypeId: ""
            },
            Action.ADD
          );
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
              value={selectedItem?.itemTypeId}
              onChange={(e) =>
                selectedItem &&
                setSelectedItem({ ...selectedItem, itemTypeId: e.target.value })
              }
            >
              {itemTypes.map((type: IItemType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
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
    </div>
  );
};

export default ObjectsPage;
