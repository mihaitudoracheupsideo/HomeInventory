import { Box, Typography, IconButton } from '@mui/material';
import { ChevronRight, ExpandMore, Folder, FolderOpen } from '@mui/icons-material';
import type { IItem } from '../types/IItem';
import ItemTypeName from './ItemTypeName';

interface ItemTreeNodeProps {
  item: IItem;
  onSelect: (item: IItem) => void;
  onToggleExpand: (itemId: string) => void;
  expanded: boolean;
  selected: boolean;
}

export default function ItemTreeNode({
  item,
  onSelect,
  onToggleExpand,
  expanded,
  selected
}: ItemTreeNodeProps) {
  const hasChildren = item.childrenCount && item.childrenCount > 0;
  const indent = (item.depth || 0) * 20;

  const getItemIcon = () => {
    if (item.itemType?.canContainItems) {
      return expanded ? <FolderOpen /> : <Folder />;
    }
    return <span>📦</span>; // Default item icon
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          cursor: 'pointer',
          backgroundColor: selected ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          ml: `${indent}px`
        }}
        onClick={() => onSelect(item)}
      >
        {hasChildren && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(item.id);
            }}
          >
            {expanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        )}
        {!hasChildren && <Box sx={{ width: 32 }} />}
        {getItemIcon()}
        <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
          {item.name}
        </Typography>
        {item.itemType && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            <ItemTypeName itemType={item.itemType} />
          </Typography>
        )}
      </Box>
    </Box>
  );
}