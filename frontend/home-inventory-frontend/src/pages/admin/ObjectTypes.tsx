import { useState } from "react";
import type { ObjectType } from '../../types/objectTypes'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from '../../components/ui/button'


const objectTypes: ObjectType[] = [
  { id: 1, name: "Individual", description: "Obiect simplu" },
  { id: 2, name: "Box", description: "Cutie care conține obiecte" },
  { id: 3, name: "Room", description: "Locație fizică" },
];

export default function ObjectTypesPage() {
  const [types, setTypes] = useState<ObjectType[]>(objectTypes);
  const [selectedType, setSelectedType] = useState<ObjectType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");



  const handleEdit = (type: ObjectType): void => {
    setSelectedType(type);
    setEditName(type.name);
    setShowEditDialog(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tipuri de obiecte</h1>
      <table className="min-w-full bg-white border border-gray-200 shadow">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">#</th>
            <th className="p-2 border-b">Nume</th>
            <th className="p-2 border-b">Descriere</th>
            <th className="p-2 border-b">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 text-left">
              <td className="p-2 border-b">{t.id}</td>
              <td className="p-2 border-b">{t.name}</td>
              <td className="p-2 border-b">{t.description}</td>
              <td className="p-2 border-b space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleEdit(t)}>Editează</button>
                <button className="text-red-600 hover:underline">Șterge</button>
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
          <Input
            value={editName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
            placeholder="Nume tip obiect"
          />
          <DialogFooter>
            <Button variant="destructive" onClick={() => setShowEditDialog(false)}>Anulează</Button>
            <Button className='ml-2 bg-gray-50' variant="default"
              onClick={() => {
                if (selectedType) {
                  setTypes(types.map(t => t.id === selectedType.id ? { ...t, name: editName } : t));
                }
                setShowEditDialog(false);
              }}
            >
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  );
}