import { api } from "./api";

export interface GetItemsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdvancedSearchItemsOptions {
  query?: string;
  tags?: string[];
  parentItemId?: string;
  itemTypeId?: string;
  tagMatchMode?: 'all' | 'any';
  rootOnly?: boolean;
  withImageOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SyncResponse<T> {
  data: T[];
  syncTimestamp: string;
}

export const getItems = (searchOrOptions?: string | GetItemsOptions) => {
  const params = new URLSearchParams();

  if (typeof searchOrOptions === 'string') {
    if (searchOrOptions) {
      params.append('search', searchOrOptions);
    }
  } else if (searchOrOptions) {
    if (searchOrOptions.search) {
      params.append('search', searchOrOptions.search);
    }

    if (typeof searchOrOptions.page === 'number') {
      params.append('page', String(searchOrOptions.page));
    }

    if (typeof searchOrOptions.pageSize === 'number') {
      params.append('pageSize', String(searchOrOptions.pageSize));
    }
  }

  return api.get(`/items?${params.toString()}`);
};

export const advancedSearchItems = (options: AdvancedSearchItemsOptions) => {
  const params = new URLSearchParams();

  if (options.query) {
    params.append('query', options.query);
  }

  options.tags?.forEach((tag) => {
    if (tag) {
      params.append('tag', tag);
    }
  });

  if (options.parentItemId) {
    params.append('parentItemId', options.parentItemId);
  }

  if (options.itemTypeId) {
    params.append('itemTypeId', options.itemTypeId);
  }

  if (options.tagMatchMode) {
    params.append('tagMatchMode', options.tagMatchMode);
  }

  if (options.rootOnly) {
    params.append('rootOnly', 'true');
  }

  if (options.withImageOnly) {
    params.append('withImageOnly', 'true');
  }

  if (typeof options.page === 'number') {
    params.append('page', String(options.page));
  }

  if (typeof options.pageSize === 'number') {
    params.append('pageSize', String(options.pageSize));
  }

  return api.get(`/items/advanced-search?${params.toString()}`);
};
export const getItemsByLocation = (locationId: string) => api.get(`/locations/items/${locationId}`);
export const getItem = (id: unknown) => api.get(`/items/${id}`);
export const getItemByUniqueCode = (uniqueCode: string) => api.get(`/items/code/${uniqueCode}`);
export const getItemsSync = (since?: string) => api.get('/items/sync', {
  params: since ? { since } : undefined,
});
export const getTree = () => api.get('/items/tree');
export const getChildren = (id: string) => api.get(`/items/${id}/children`);
export const getSubtree = (id: string) => api.get(`/items/${id}/subtree`);
export const getBreadcrumbs = (id: string) => api.get(`/items/${id}/breadcrumbs`);
export const createItem = (data:unknown) => api.post("/items/create", data);
export const updateItem = (id:unknown, data:unknown) => api.put(`/items/${id}`, data);
export const deleteItem = (id:unknown) => api.delete(`/items/${id}`);