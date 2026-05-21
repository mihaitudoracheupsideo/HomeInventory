import { api } from './api';
import type { ITag, ITagPayload } from '../types/ITag';

export const getTags = () => api.get<ITag[]>('/tags');

export const getTagsSync = (since?: string) => api.get('/tags/sync', {
  params: since ? { since } : undefined,
});

export const searchTags = (query: string, maxResults = 10) =>
  api.get<ITag[]>('/tags/search', {
    params: {
      query,
      maxResults,
    },
  });

export const getTag = (id: string) => api.get<ITag>(`/tags/${id}`);

export const createTag = (data: ITagPayload) => api.post<ITag>('/tags', data);

export const updateTag = (id: string, data: ITagPayload) => api.put<ITag>(`/tags/${id}`, data);

export const deleteTag = (id: string) => api.delete(`/tags/${id}`);

export const getItemTags = (itemId: string) => api.get<ITag[]>(`/tags/items/${itemId}/tags`);

export const assignTagsToItem = (itemId: string, tagNames: string[]) =>
  api.post(`/tags/items/${itemId}/tags`, tagNames);

export const removeTagFromItem = (itemId: string, tagId: string) =>
  api.delete(`/tags/items/${itemId}/tags/${tagId}`);