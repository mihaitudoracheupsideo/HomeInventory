import { api } from "./api";

export const getItems = (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  return api.get(`/items?${params.toString()}`);
};
export const getItemsByLocation = (locationId: string) => api.get(`/locations/items/${locationId}`);
export const getItem = (id: unknown) => api.get(`/items/${id}`);
export const getItemByUniqueCode = (uniqueCode: string) => api.get(`/items/code/${uniqueCode}`);
export const createItem = (data:unknown) => api.post("/items/create", data);
export const updateItem = (id:unknown, data:unknown) => api.put(`/items/${id}`, data);
export const deleteItem = (id:unknown) => api.delete(`/items/${id}`);