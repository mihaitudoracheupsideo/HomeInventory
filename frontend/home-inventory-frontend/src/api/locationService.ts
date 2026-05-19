import { api } from "./api";

export const getLocationHistory = async (itemId: string) => {
  const response = await api.get(`/locations/history/${itemId}`);
  return response;
};

export const setCurrentLocation = async (itemId: string, locationItemId?: string) => {
  const response = await api.post(`/locations`, {
    itemId,
    locationItemId,
  });
  return response;
};

export const searchItems = async (searchTerm: string) => {
  const response = await api.get(`/items?search=${encodeURIComponent(searchTerm)}&pageSize=10`);
  return response;
};