import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { getItems } from "../api/itemService";
import { getItemTypes } from "../api/itemTypeService";

const getNavStyle = ({ isActive }: { isActive: boolean }) => {
  return `px-3 py-2 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`;
};

export default function MainLayout() {
  const [stats, setStats] = useState({ items: 0, itemTypes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [itemsResponse, itemTypesResponse] = await Promise.all([
          getItems(),
          getItemTypes()
        ]);
        setStats({
          items: itemsResponse.data.data?.length || 0,
          itemTypes: itemTypesResponse.data.data?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Inventory</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/" className={(isActive) => getNavStyle(isActive)}>
            Dashboard
          </NavLink>
          <NavLink
            to="/object-types"
            className={(isActive) => getNavStyle(isActive)}
          >
            Tipuri obiecte
          </NavLink>
          <NavLink
            to="/objects"
            className={(isActive) => getNavStyle(isActive)}
          >
            Obiecte
          </NavLink>
          <NavLink to="/about" className={(isActive) => getNavStyle(isActive)}>
            About
          </NavLink>
        </nav>

        {/* Sidebar Stats Section */}
        <Box sx={{ mt: 'auto', pt: 4 }}>
          <Divider sx={{ bgcolor: 'gray.600', mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 2, color: 'gray.300' }}>
            Quick Stats
          </Typography>
          <Box sx={{ spaceY: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'gray.400' }}>
                Total Items:
              </Typography>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.items}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'gray.400' }}>
                Item Types:
              </Typography>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.itemTypes}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'gray.400' }}>
                Last Updated:
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray.500', fontSize: '0.75rem' }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6 h-full w-full">
        <div className="h-full w-full overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
