import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { usePageTitle } from '../contexts/PageTitleContext';
import { getItemTypes, createItemType, updateItemType, deleteItemType } from '../api/itemTypeService';
import { getTags, createTag, updateTag, deleteTag } from '../api/tagService';
import type { IItemType } from '../types/IItemType';
import type { ITag, ITagPayload } from '../types/ITag';
import { TAG_TYPE_OPTIONS, TagType } from '../types/ITag';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<IItemType | null>(null);
  const [editingTag, setEditingTag] = useState<ITag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    canContainItems: false,
    isLeaf: false,
    color: '#000000',
    sortOrder: 0
  });
  const [tagFormData, setTagFormData] = useState<ITagPayload>({
    name: '',
    type: TagType.Generic,
    color: '#2563eb',
    icon: '',
  });
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Settings");
  }, [setTitle]);

  useEffect(() => {
    void loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      await Promise.all([loadItemTypes(), loadTags()]);
    } finally {
      setLoading(false);
    }
  };

  const loadItemTypes = async () => {
    try {
      const response = await getItemTypes();
      setItemTypes(response.data.data || []);
    } catch (error) {
      console.error('Error loading item types:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await getTags();
      setTags(response.data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (itemType?: IItemType) => {
    if (itemType) {
      setEditingItemType(itemType);
      setFormData({
        name: itemType.name,
        description: itemType.description || '',
        icon: itemType.icon || '',
        canContainItems: itemType.canContainItems || false,
        isLeaf: itemType.isLeaf || false,
        color: itemType.color || '#000000',
        sortOrder: itemType.sortOrder || 0
      });
    } else {
      setEditingItemType(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
        canContainItems: false,
        isLeaf: false,
        color: '#000000',
        sortOrder: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItemType(null);
  };

  const handleOpenTagDialog = (tag?: ITag) => {
    if (tag) {
      setEditingTag(tag);
      setTagFormData({
        name: tag.name,
        type: tag.type,
        color: tag.color || '#2563eb',
        icon: tag.icon || '',
      });
    } else {
      setEditingTag(null);
      setTagFormData({
        name: '',
        type: TagType.Generic,
        color: '#2563eb',
        icon: '',
      });
    }

    setTagDialogOpen(true);
  };

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false);
    setEditingTag(null);
  };

  const handleSave = async () => {
    try {
      if (editingItemType) {
        await updateItemType(editingItemType.id, formData);
      } else {
        await createItemType(formData);
      }
      await loadItemTypes();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving item type:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item type?')) {
      try {
        await deleteItemType(id);
        await loadItemTypes();
      } catch (error) {
        console.error('Error deleting item type:', error);
      }
    }
  };

  const handleSaveTag = async () => {
    try {
      if (editingTag) {
        await updateTag(editingTag.id, tagFormData);
        toast.success('Tag updated successfully');
      } else {
        await createTag(tagFormData);
        toast.success('Tag created successfully');
      }

      await loadTags();
      handleCloseTagDialog();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error('Failed to save tag');
    }
  };

  const handleDeleteTag = async (tag: ITag) => {
    if (!tag.canDelete) {
      return;
    }

    if (window.confirm(`Delete tag "${tag.name}"?`)) {
      try {
        await deleteTag(tag.id);
        toast.success('Tag deleted successfully');
        await loadTags();
      } catch (error) {
        console.error('Error deleting tag:', error);
        toast.error('Failed to delete tag');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="General" />
          <Tab label="Item Types" />
          <Tab label="Tags" />
          <Tab label="QR Settings" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6">General Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            General application settings will be implemented here.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Item Types Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Item Type
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Can Contain Items</TableCell>
                  <TableCell>Is Leaf</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Sort Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemTypes.map((itemType) => (
                  <TableRow key={itemType.id}>
                    <TableCell>{itemType.name}</TableCell>
                    <TableCell>{itemType.description}</TableCell>
                    <TableCell>{itemType.icon}</TableCell>
                    <TableCell>{itemType.canContainItems ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{itemType.isLeaf ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: itemType.color,
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>{itemType.sortOrder}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(itemType)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(itemType.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tags Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenTagDialog()}
            >
              Add Tag
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>
                      {TAG_TYPE_OPTIONS.find((option) => option.value === tag.type)?.label || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: tag.color || '#94a3b8',
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.12)'
                          }}
                        />
                        <Typography variant="body2">{tag.color || '-'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{tag.icon || '-'}</TableCell>
                    <TableCell>{tag.usageCount ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={tag.canDelete ? 'Unused' : 'In use'}
                        color={tag.canDelete ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenTagDialog(tag)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteTag(tag)}
                        disabled={!tag.canDelete}
                        title={tag.canDelete ? 'Delete tag' : `Cannot delete tag used by ${tag.usageCount ?? 0} items`}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6">QR Code Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            QR code generation settings will be implemented here.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Item Type Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItemType ? 'Edit Item Type' : 'Add Item Type'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Icon"
            fullWidth
            variant="outlined"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Color"
            fullWidth
            variant="outlined"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Sort Order"
            fullWidth
            variant="outlined"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingItemType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={tagDialogOpen} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTag ? 'Edit Tag' : 'Add Tag'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={tagFormData.name}
            onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Type"
            select
            fullWidth
            variant="outlined"
            value={tagFormData.type}
            onChange={(e) => setTagFormData({ ...tagFormData, type: Number(e.target.value) as TagType })}
          >
            {TAG_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Color"
            fullWidth
            variant="outlined"
            type="color"
            value={tagFormData.color || '#2563eb'}
            onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Icon"
            fullWidth
            variant="outlined"
            value={tagFormData.icon || ''}
            onChange={(e) => setTagFormData({ ...tagFormData, icon: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>Cancel</Button>
          <Button onClick={handleSaveTag} variant="contained">
            {editingTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;