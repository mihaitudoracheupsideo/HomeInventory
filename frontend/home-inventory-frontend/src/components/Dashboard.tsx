import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { getItems } from '../api/itemService';
import { getItemTypes } from '../api/itemTypeService';
import type { IItem } from '../types/IItem';
import type { IItemType } from '../types/IItemType';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: 'Item' | 'ItemType';
  itemTypeName?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);
  const [loading, setLoading] = useState(false);

  const handleViewDetail = (result: SearchResult) => {
    if (result.type === 'Item') {
      navigate(`/objects/${result.id}`);
    }
    // For ItemType, we could navigate to a different page if needed
    // For now, only Items have detail pages
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsResponse, itemTypesResponse] = await Promise.all([
          getItems(),
          getItemTypes()
        ]);
        setItems(itemsResponse.data.data || []);
        setItemTypes(itemTypesResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const searchResults: SearchResult[] = [];

    // Search in items
    items.forEach(item => {
      if (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        searchResults.push({
          id: item.id,
          name: item.name,
          description: item.description,
          type: 'Item',
          itemTypeName: item.itemType?.name || 'Unknown'
        });
      }
    });

    // Search in item types
    itemTypes.forEach(itemType => {
      if (
        itemType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemType.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        searchResults.push({
          id: itemType.id,
          name: itemType.name,
          description: itemType.description,
          type: 'ItemType'
        });
      }
    });

    setResults(searchResults);
    setLoading(false);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'itemTypeName', headerName: 'Item Type', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<SearchResult>) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleViewDetail(params.row)}
          disabled={params.row.type === 'ItemType'} // Only enable for Items
          sx={{ minWidth: 'auto', px: 1 }}
        >
          👁️
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Home Inventory Dashboard
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search Items or Types"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={results}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5 },
            },
          }}
          pageSizeOptions={[5]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default Dashboard;