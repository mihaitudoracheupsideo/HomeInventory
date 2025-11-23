import React from "react";
import { CornerDownRight, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IItem } from "../types/IItem";

interface LocationHierarchyProps {
  item: IItem;
}


const LocationHierarchy: React.FC<LocationHierarchyProps> = ({ item }) => {
  const navigate = useNavigate();

  const handleNavigateToItem = (itemId: string) => {
    navigate(`/objects/${itemId}`);
  };

  // Prevent cycles by tracking visited IDs
  const renderHierarchyLevel = (currentItem: IItem | null, depth: number = 0, visited: Set<string> = new Set()): React.JSX.Element | null => {
    if (!currentItem || visited.has(currentItem.id)) return null;
    visited.add(currentItem.id);

    return (
      <div key={currentItem.id} className="space-y-2">
        <div
          className={`flex items-center gap-2 p-2 rounded-md border min-w-0 flex-1 ${
            depth === 0
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <CornerDownRight className={`flex-shrink-0 ${
            depth === 0
              ? 'w-5 h-5 text-blue-600 dark:text-blue-400'
              : 'w-4 h-4 text-green-600 dark:text-green-400'
          }`} />
          <span className={`font-medium truncate ${
            depth === 0
              ? 'text-base text-blue-900 dark:text-blue-100'
              : 'text-sm text-green-900 dark:text-green-100'
          }`}>
            {currentItem.name}
          </span>
          <span className={`px-2 py-1 rounded flex-shrink-0 ${
            depth === 0
              ? 'text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900'
              : 'text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900'
          }`}>
            {currentItem.uniqueCode}
          </span>
          <button
            onClick={() => handleNavigateToItem(currentItem.id)}
            className={`ml-auto flex-shrink-0 p-1 rounded transition-colors ${
              depth === 0
                ? 'hover:bg-blue-100 dark:hover:bg-blue-800'
                : 'hover:bg-green-100 dark:hover:bg-green-800'
            }`}
            title={`Go to ${currentItem.name}`}
          >
            <ArrowRight className={`${
              depth === 0
                ? 'w-5 h-5 text-blue-600 dark:text-blue-400'
                : 'w-4 h-4 text-green-600 dark:text-green-400'
            }`} />
          </button>
        </div>
        {renderHierarchyLevel(currentItem.currentLocationItem || null, depth + 1, visited)}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Parent Chain - Recursive */}
      {item.currentLocationItem ? (
        renderHierarchyLevel(item.currentLocationItem, 0)
      ) : (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm font-medium text-red-900 dark:text-red-100">Locația nu este setată</span>
        </div>
      )}
    </div>
  );
};

export default LocationHierarchy;