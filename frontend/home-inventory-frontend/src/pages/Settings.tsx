import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { usePageTitle } from '../contexts/PageTitleContext';
import { getItemTypes, createItemType, updateItemType, deleteItemType } from '../api/itemTypeService';
import type { IItemType } from '../types/IItemType';

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<IItemType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    canContainItems: false,
    isLeaf: false,
    color: '#000000',
    sortOrder: 0
  });
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Settings");
  }, [setTitle]);

  useEffect(() => {
    loadItemTypes();
  }, []);

  const loadItemTypes = async () => {
    try {
      const response = await getItemTypes();
      setItemTypes(response.data.data || []);
    } catch (error) {
      console.error('Error loading item types:', error);
    } finally {
      setLoading(false);
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
    </Box>
  );
};

export default SettingsPage;