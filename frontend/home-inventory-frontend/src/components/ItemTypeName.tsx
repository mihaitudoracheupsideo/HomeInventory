import type { IItemType } from '../types/IItemType';

interface ItemTypeNameProps {
  itemType?: Pick<IItemType, 'name' | 'color'> | null;
  fallback?: string;
  className?: string;
  variant?: 'text' | 'pill';
}

const withAlpha = (hexColor: string, alpha: string) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return undefined;
  }

  return `${hexColor}${alpha}`;
};

const ItemTypeName = ({ itemType, fallback = '-', className = '', variant = 'text' }: ItemTypeNameProps) => {
  const label = itemType?.name?.trim() || fallback;
  const color = itemType?.color;

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
        style={color ? { color, backgroundColor: withAlpha(color, '1A'), border: `1px solid ${withAlpha(color, '40') ?? color}` } : undefined}
      >
        {label}
      </span>
    );
  }

  return (
    <span className={className} style={color ? { color } : undefined}>
      {label}
    </span>
  );
};

export default ItemTypeName;