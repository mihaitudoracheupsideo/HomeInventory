import { api } from "./api";

export const getItems = () => api.get("/items");
export const getItem = (id: unknown) => api.get(`/items/${id}`);
export const getItemByUniqueCode = (uniqueCode: string) => api.get(`/items/code/${uniqueCode}`);
export const createItem = (data:unknown) => api.post("/items/create", data);
export const updateItem = (id:unknown, data:unknown) => api.put(`/items/${id}`, data);
export const deleteItem = (id:unknown) => api.delete(`/items/${id}`);