import {
  createItemType,
  deleteItemType,
  getItemTypesSync,
  updateItemType,
} from '../api/itemTypeService';
import { db, SYNC_KEYS, type CachedItemType, type SyncQueueEntry } from '../storage/indexedDb';
import { isOnline } from '../utils/network';

export interface ItemTypeMutationPayload {
  name: string;
  description?: string;
  icon?: string;
  canContainItems?: boolean;
  isLeaf?: boolean;
  color?: string;
  sortOrder?: number;
}

const TEMP_ITEM_TYPE_PREFIX = 'temp:itemType:';

const createTempId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${TEMP_ITEM_TYPE_PREFIX}${crypto.randomUUID()}`;
  }

  return `${TEMP_ITEM_TYPE_PREFIX}${Date.now()}`;
};

const isServerError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'response' in error;

const normalizeItemType = (itemType: CachedItemType): CachedItemType => ({
  ...itemType,
  description: itemType.description ?? '',
  updatedAt: itemType.updatedAt ?? new Date().toISOString(),
  deleted: itemType.deleted ?? false,
});

const readItemTypesMap = async () => new Map((await db.itemTypes.toArray()).map((itemType) => [itemType.id, normalizeItemType(itemType)]));

const writeItemTypesMap = async (itemTypesMap: Map<string, CachedItemType>, syncTimestamp?: string) => {
  const values = Array.from(itemTypesMap.values()).map(normalizeItemType);
  await db.itemTypes.clear();

  if (values.length > 0) {
    await db.itemTypes.bulkPut(values);
  }

  if (syncTimestamp) {
    await db.settings.put({ key: SYNC_KEYS.itemTypes, value: syncTimestamp });
  }
};

const findQueuedEntry = async (operation: SyncQueueEntry['operation'], recordId: string) =>
  (await db.syncQueue.toArray()).find((entry) =>
    entry.entity === 'itemType' &&
    entry.operation === operation &&
    entry.recordId === recordId,
  );

const putQueuedEntry = async (entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>) => {
  const existingEntry = await findQueuedEntry(entry.operation, entry.recordId);

  if (existingEntry?.id) {
    await db.syncQueue.update(existingEntry.id, { payload: entry.payload });
    return;
  }

  await db.syncQueue.add({
    ...entry,
    createdAt: new Date().toISOString(),
  });
};

export const getCachedItemTypes = async () => {
  const itemTypes = await db.itemTypes.orderBy('name').toArray();
  return itemTypes.map(normalizeItemType);
};

export const replaceCachedItemTypes = async (itemTypes: CachedItemType[]) => {
  const map = new Map(itemTypes.map((itemType) => [itemType.id, normalizeItemType(itemType)]));
  await writeItemTypesMap(map, new Date().toISOString());
};

export const syncItemTypesFromServer = async () => {
  const since = (await db.settings.get(SYNC_KEYS.itemTypes))?.value;
  const response = await getItemTypesSync(since);
  const payload = response.data as { data?: CachedItemType[]; syncTimestamp?: string; Data?: CachedItemType[]; SyncTimestamp?: string };
  const itemTypes = (payload.data ?? payload.Data ?? []).map(normalizeItemType);
  const syncTimestamp = payload.syncTimestamp ?? payload.SyncTimestamp ?? new Date().toISOString();
  const map = await readItemTypesMap();
  itemTypes.forEach((itemType) => {
    if (itemType.deleted) {
      map.delete(itemType.id);
      return;
    }

    map.set(itemType.id, itemType);
  });
  await writeItemTypesMap(map, syncTimestamp);
  return itemTypes;
};

export const createItemTypeRecord = async (payload: ItemTypeMutationPayload) => {
  const tempId = createTempId();
  const localItemType = normalizeItemType({
    id: tempId,
    name: payload.name,
    description: payload.description ?? '',
    icon: payload.icon,
    canContainItems: payload.canContainItems,
    isLeaf: payload.isLeaf,
    color: payload.color,
    sortOrder: payload.sortOrder,
  });
  const map = await readItemTypesMap();
  map.set(tempId, localItemType);
  await writeItemTypesMap(map);

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'itemType', operation: 'create', recordId: tempId, payload });
    return localItemType;
  }

  try {
    const response = await createItemType(payload);
    map.delete(tempId);
    map.set((response.data as CachedItemType).id, normalizeItemType(response.data as CachedItemType));
    await writeItemTypesMap(map);
    return response.data as CachedItemType;
  } catch (error) {
    if (isServerError(error)) {
      map.delete(tempId);
      await writeItemTypesMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'itemType', operation: 'create', recordId: tempId, payload });
    return localItemType;
  }
};

export const updateItemTypeRecord = async (id: string, payload: ItemTypeMutationPayload) => {
  const map = await readItemTypesMap();
  const previousItemType = map.get(id);
  if (!previousItemType) {
    throw new Error(`Item type ${id} not found in local cache.`);
  }

  const nextItemType = normalizeItemType({ ...previousItemType, ...payload, id, updatedAt: new Date().toISOString() });
  map.set(id, nextItemType);
  await writeItemTypesMap(map);

  const pendingCreate = await findQueuedEntry('create', id);
  if (pendingCreate?.id) {
    await db.syncQueue.update(pendingCreate.id, { payload: { ...(pendingCreate.payload as ItemTypeMutationPayload), ...payload } });
    return nextItemType;
  }

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'itemType', operation: 'update', recordId: id, payload });
    return nextItemType;
  }

  try {
    await updateItemType(id, payload);
    return nextItemType;
  } catch (error) {
    if (isServerError(error)) {
      map.set(id, previousItemType);
      await writeItemTypesMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'itemType', operation: 'update', recordId: id, payload });
    return nextItemType;
  }
};

export const deleteItemTypeRecord = async (id: string) => {
  const map = await readItemTypesMap();
  const previousItemType = map.get(id);
  if (!previousItemType) {
    return;
  }

  map.delete(id);
  await writeItemTypesMap(map);

  const pendingCreate = await findQueuedEntry('create', id);
  if (pendingCreate?.id) {
    await db.syncQueue.delete(pendingCreate.id);
    return;
  }

  const pendingUpdate = await findQueuedEntry('update', id);
  if (pendingUpdate?.id) {
    await db.syncQueue.delete(pendingUpdate.id);
  }

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'itemType', operation: 'delete', recordId: id, payload: null });
    return;
  }

  try {
    await deleteItemType(id);
  } catch (error) {
    if (isServerError(error)) {
      map.set(id, previousItemType);
      await writeItemTypesMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'itemType', operation: 'delete', recordId: id, payload: null });
  }
};

export const replayQueuedItemTypeMutation = async (entry: SyncQueueEntry) => {
  if (entry.operation === 'create') {
    await createItemType(entry.payload);
    await db.itemTypes.delete(entry.recordId);
    return;
  }

  if (entry.operation === 'update') {
    await updateItemType(entry.recordId, entry.payload);
    return;
  }

  await deleteItemType(entry.recordId);
};