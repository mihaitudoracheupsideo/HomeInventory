import axios from "axios";

const API_BASE_URL = "http://localhost:5005/api";

export const getLocationHistory = async (itemId: string) => {
  const response = await axios.get(`${API_BASE_URL}/locations/history/${itemId}`);
  return response;
};

export const setCurrentLocation = async (itemId: string, locationItemId: string) => {
  const response = await axios.post(`${API_BASE_URL}/locations`, {
    itemId,
    locationItemId,
  });
  return response;
};

export const searchItems = async (searchTerm: string) => {
  const response = await axios.get(`${API_BASE_URL}/items?search=${encodeURIComponent(searchTerm)}`);
  return response;
};