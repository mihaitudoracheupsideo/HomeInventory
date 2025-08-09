import { api } from "./api";

export const getItemTypes = () => api.get("/itemtypes");
export const createItemType = (data:unknown) => api.post("/itemtypes", data);
export const updateItemType = (id:unknown, data:unknown) => api.put(`/itemtypes/${id}`, data);
export const deleteItemType = (id:unknown) => api.delete(`/itemtypes/${id}`);