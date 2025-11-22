import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { getItems } from '../api/itemService';
import { getItemTypes } from '../api/itemTypeService';
import type { IItem } from '../types/IItem';
import type { IItemType } from '../types/IItemType';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<IItem[]>([]);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);

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

  // Calculate statistics
  const totalItems = items.length;
  const totalItemTypes = itemTypes.length;
  const itemsWithImages = items.filter(item => item.imagePath).length;
  const recentItems = items.slice(0, 5); // Show first 5 items since we don't have createdAt

  const StatCard = ({
    title,
    value,
    icon,
    color = 'primary'
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, color: `${color}.main` }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ color: `${color}.main`, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Home Inventory Dashboard
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <StatCard
            title="Total Items"
            value={totalItems}
            icon={<InventoryIcon fontSize="large" />}
            color="primary"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <StatCard
            title="Item Types"
            value={totalItemTypes}
            icon={<CategoryIcon fontSize="large" />}
            color="secondary"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <StatCard
            title="Items with Images"
            value={itemsWithImages}
            icon={<ImageIcon fontSize="large" />}
            color="success"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <StatCard
            title="Items without Images"
            value={totalItems - itemsWithImages}
            icon={<TimelineIcon fontSize="large" />}
            color="warning"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Recent Items
              </Typography>
              {recentItems.length > 0 ? (
                <List>
                  {recentItems.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{ px: 0 }}
                      secondaryAction={
                        <Button
                          size="small"
                          onClick={() => navigate(`/objects/${item.id}`)}
                        >
                          View
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={item.itemType?.name || 'Unknown'}
                              size="small"
                              variant="outlined"
                            />
                            {item.tags && item.tags.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Tags: {item.tags.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No items found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/objects')}
                  startIcon={<InventoryIcon />}
                >
                  Manage Items
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/object-types')}
                  startIcon={<CategoryIcon />}
                >
                  Manage Item Types
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate('/about')}
                >
                  View About Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;