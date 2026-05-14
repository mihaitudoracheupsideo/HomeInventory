import React, { useState, useEffect } from 'react';
import { Box, Typography, Breadcrumbs, Link, Paper } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import ItemTreeNode from './ItemTreeNode';
import { getTree, getChildren, getBreadcrumbs } from '../api/itemService';
import type { IItem } from '../types/IItem';

interface ItemExplorerProps {
  onItemSelect: (item: IItem) => void;
  selectedItemId?: string;
}

export default function ItemExplorer({ onItemSelect, selectedItemId }: ItemExplorerProps) {
  const [treeData, setTreeData] = useState<IItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreeData();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      loadBreadcrumbs(selectedItemId);
    }
  }, [selectedItemId]);

  const loadTreeData = async () => {
    try {
      const response = await getTree();
      setTreeData(response.data);
    } catch (error) {
      console.error('Error loading tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBreadcrumbs = async (itemId: string) => {
    try {
      const response = await getBreadcrumbs(itemId);
      setBreadcrumbs(response.data);
    } catch (error) {
      console.error('Error loading breadcrumbs:', error);
    }
  };

  const handleToggleExpand = async (itemId: string) => {
    const newExpanded = new Set(expandedItems);

    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
      // Load children if not already loaded
      const item = findItemInTree(treeData, itemId);
      if (item && !item.children) {
        try {
          const response = await getChildren(itemId);
          item.children = response.data;
        } catch (error) {
          console.error('Error loading children:', error);
        }
      }
    }

    setExpandedItems(newExpanded);
  };

  const findItemInTree = (items: IItem[], itemId: string): IItem | null => {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.children) {
        const found = findItemInTree(item.children, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  const renderTree = (items: IItem[]): React.ReactNode => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <ItemTreeNode
          item={item}
          onSelect={onItemSelect}
          onToggleExpand={handleToggleExpand}
          expanded={expandedItems.has(item.id)}
          selected={selectedItemId === item.id}
        />
        {expandedItems.has(item.id) && item.children && (
          renderTree(item.children)
        )}
      </React.Fragment>
    ));
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading tree...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Paper sx={{ p: 1, mb: 1 }}>
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            maxItems={3}
            itemsAfterCollapse={1}
            itemsBeforeCollapse={1}
          >
            {breadcrumbs.map((crumb) => (
              <Link
                key={crumb.id}
                component="button"
                variant="body2"
                onClick={() => onItemSelect(crumb)}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Paper>
      )}

      {/* Tree */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {renderTree(treeData)}
      </Box>
    </Box>
  );
}