import Dexie, { type EntityTable } from 'dexie';
import type { IItem } from '../types/IItem';
import type { IItemType } from '../types/IItemType';
import type { ITag } from '../types/ITag';

export interface SyncMetadata {
  key: string;
  value: string;
}

export interface SyncQueueEntry {
  id?: number;
  entity: 'item' | 'itemType' | 'tag';
  operation: 'create' | 'update' | 'delete';
  recordId: string;
  payload: unknown;
  createdAt: string;
}

export interface CachedItem extends IItem {
  deleted?: boolean;
}

export interface CachedItemType extends IItemType {
  updatedAt?: string;
  deleted?: boolean;
}

export interface CachedTag extends ITag {
  updatedAt?: string;
  deleted?: boolean;
}

class HomeInventoryDatabase extends Dexie {
  items!: EntityTable<CachedItem, 'id'>;
  itemTypes!: EntityTable<CachedItemType, 'id'>;
  tags!: EntityTable<CachedTag, 'id'>;
  settings!: EntityTable<SyncMetadata, 'key'>;
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>;

  constructor() {
    super('HomeInventoryDatabase');

    this.version(1).stores({
      items: 'id, name, itemTypeId, parentItemId, updatedAt',
      itemTypes: 'id, name, updatedAt',
      tags: 'id, name, normalizedName, updatedAt',
      settings: 'key',
      syncQueue: '++id, entity, operation, createdAt, recordId',
    });
  }
}

export const db = new HomeInventoryDatabase();

export const SYNC_KEYS = {
  items: 'items:lastSync',
  itemTypes: 'itemTypes:lastSync',
  tags: 'tags:lastSync',
} as const;