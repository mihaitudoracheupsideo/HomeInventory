import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ChangeEvent } from "react";
import {
  getItem,
  updateItem,
  getItemByUniqueCode,
} from "../../api/itemService";
import type { IItem } from "../../types/IItem";
import type { IItemType } from "../../types/IItemType";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { getItemTypes } from "../../api/itemTypeService";
import QRCodeDisplay from "../../components/QRCodeDisplay";

const ItemDetailPage = () => {
  const { id, uniqueCode } = useParams<{ id?: string; uniqueCode?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<IItem | null>(null);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.Data || [];
      setItemTypes(payload);
    } catch (err) {
      console.error("Error fetching item types", err);
    }
  }, []);

  useEffect(() => {
    void loadItem();
    void loadItemTypes();
  }, [loadItem, loadItemTypes]);

  const handleSave = async () => {
    if (!item) return;

    setSaving(true);
    try {
      await updateItem(item.id, item);
      navigate("/objects");
    } catch (err) {
      console.error("Error updating item", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/objects");
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
    <div className="w-full h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Item Details</h1>

        <div className="space-y-6">
          {/* ID Field - Read Only */}
          <div>
            <Label className="block mb-2 text-sm font-medium" htmlFor="itemId">
              ID
            </Label>
            <Input
              id="itemId"
              value={item.id}
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* Name Field */}
          <div>
            <Label className="block mb-2 text-sm font-medium" htmlFor="itemName">
              Name
            </Label>
            <Input
              id="itemName"
              value={item.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setItem({ ...item, name: e.target.value })
              }
              placeholder="Enter item name"
            />
          </div>

          {/* Description Field */}
          <div>
            <Label className="block mb-2 text-sm font-medium" htmlFor="itemDescription">
              Description
            </Label>
            <Input
              id="itemDescription"
              value={item.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setItem({ ...item, description: e.target.value })
              }
              placeholder="Enter item description"
            />
          </div>

          {/* Item Type Field */}
          <div>
            <Label className="block mb-2 text-sm font-medium" htmlFor="itemType">
              Item Type
            </Label>
            <select
              id="itemType"
              className="border p-2 w-full rounded"
              value={item.itemTypeId ?? ""}
              onChange={(e) =>
                setItem({ ...item, itemTypeId: e.target.value })
              }
            >
              <option value="" disabled>
                Select an item type
              </option>
              {itemTypes.map((type: IItemType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Parent ID Field - Read Only if exists */}
          {item.parentId && (
            <div>
              <Label className="block mb-2 text-sm font-medium" htmlFor="parentId">
                Parent ID
              </Label>
              <Input
                id="parentId"
                value={item.parentId}
                disabled
                className="bg-gray-100"
              />
            </div>
          )}

          {/* Children Count - Read Only */}
          {item.children && item.children.length > 0 && (
            <div>
              <Label className="block mb-2 text-sm font-medium">
                Children Count
              </Label>
              <Input
                value={`${item.children.length} children`}
                disabled
                className="bg-gray-100"
              />
            </div>
          )}

          {/* QR Code Section */}
          <div>
            <Label className="block mb-2 text-sm font-medium">
              QR Code
            </Label>
            {item.uniqueCode ? (
              <QRCodeDisplay
                value={`${window.location.origin}/item/${item.uniqueCode}`}
                size={150}
                className="border p-4 rounded"
              />
            ) : (
              <div className="border p-4 rounded bg-gray-50 text-center text-gray-500">
                QR Code will be generated after saving the item
              </div>
            )}
          </div>

          {/* Image Preview Section */}
          {item.imagePath && (
            <div>
              <Label className="block mb-2 text-sm font-medium">
                Image Preview
              </Label>
              <div className="border p-4 rounded bg-gray-50">
                <img
                  src={`http://localhost:5005/api/images/${item.imagePath}`}
                  alt={item.name}
                  className="max-w-full max-h-64 object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<p class="text-gray-500 text-center">Image not found</p>';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;