import { useNavigate } from 'react-router-dom';
import type { IItem } from '../types/IItem';

interface ItemCardProps {
  item: IItem;
  className?: string;
}

const ItemCard = ({ item, className = '' }: ItemCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/objects/${item.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-2xl shadow-soft border border-gray-200 p-6 hover:shadow-medium transition-all duration-200 cursor-pointer group ${className}`}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden group-hover:scale-105 transition-transform duration-200">
        {item.imagePath ? (
          <img
            src={`http://localhost:5005/api/images/${item.imagePath}?t=${Date.now()}`}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    📦
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            📦
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Unique Code */}
        <div className="flex items-center text-xs text-gray-500">
          <span className="font-medium">Code:</span>
          <span className="ml-1 font-mono bg-gray-100 px-2 py-1 rounded">
            {item.uniqueCode}
          </span>
        </div>

        {/* Type Badge */}
        {item.itemType && (
          <div className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
            {item.itemType.name}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center text-xs text-gray-500">
          <span className="mr-1">📍</span>
          <span className="truncate">
            {item.currentLocationItem
              ? `${item.currentLocationItem.name} (${item.currentLocationItem.uniqueCode})`
              : 'No location assigned'
            }
          </span>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm">
          →
        </div>
      </div>
    </div>
  );
};

export default ItemCard;