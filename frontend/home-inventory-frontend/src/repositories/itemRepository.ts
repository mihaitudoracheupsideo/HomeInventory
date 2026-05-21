import {
  createItem,
  deleteItem,
  getItemsSync,
  updateItem,
} from '../api/itemService';
import { db, SYNC_KEYS, type CachedItem, type SyncQueueEntry } from '../storage/indexedDb';
import { isOnline } from '../utils/network';

export interface ItemMutationPayload {
  name: string;
  description?: string | null;
  itemTypeId: string;
  tags?: string[];
  imagePath?: string | null;
  parentItemId?: string;
}

const TEMP_ITEM_PREFIX = 'temp:item:';

const createTempId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${TEMP_ITEM_PREFIX}${crypto.randomUUID()}`;
  }

  return `${TEMP_ITEM_PREFIX}${Date.now()}`;
};

const isServerError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'response' in error;

const toParentReference = (item?: CachedItem) => {
  if (!item) {
    return undefined;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    itemTypeId: item.itemTypeId,
    uniqueCode: item.uniqueCode,
    tags: item.tags ?? [],
    imagePath: item.imagePath,
    parentItemId: item.parentItemId,
    parent: item.parent,
  };
};

const normalizeItem = (item: CachedItem): CachedItem => ({
  ...item,
  tags: Array.isArray(item.tags) ? item.tags : [],
  updatedAt: item.updatedAt ?? new Date().toISOString(),
  deleted: item.deleted ?? false,
  description: item.description ?? '',
});

const rebuildItems = async (items: CachedItem[]) => {
  const itemTypes = await db.itemTypes.toArray();
  const itemTypeById = new Map(itemTypes.map((itemType) => [itemType.id, itemType]));
  const itemsById = new Map(items.map((item) => [item.id, normalizeItem(item)]));
  const childrenCounts = new Map<string, number>();

  items.forEach((item) => {
    if (item.parentItemId && itemsById.has(item.parentItemId)) {
      childrenCounts.set(item.parentItemId, (childrenCounts.get(item.parentItemId) ?? 0) + 1);
    }
  });

  return items.map((item) => {
    const normalizedItem = normalizeItem(item);
    return {
      ...normalizedItem,
      itemType: itemTypeById.get(normalizedItem.itemTypeId) ?? normalizedItem.itemType,
      parent: normalizedItem.parentItemId
        ? toParentReference(itemsById.get(normalizedItem.parentItemId))
        : undefined,
      childrenCount: childrenCounts.get(normalizedItem.id) ?? 0,
    };
  });
};

const replaceStoredItems = async (items: CachedItem[], syncTimestamp?: string) => {
  const rebuiltItems = await rebuildItems(items.map(normalizeItem));
  await db.items.clear();

  if (rebuiltItems.length > 0) {
    await db.items.bulkPut(rebuiltItems);
  }

  if (syncTimestamp) {
    await db.settings.put({
      key: SYNC_KEYS.items,
      value: syncTimestamp,
    });
  }
};

const readAllItemsMap = async () => new Map((await db.items.toArray()).map((item) => [item.id, normalizeItem(item)]));

const getQueuedItemEntries = async () =>
  (await db.syncQueue.toArray()).filter((entry) => entry.entity === 'item');

const findQueuedEntry = async (operation: SyncQueueEntry['operation'], recordId: string) =>
  (await getQueuedItemEntries()).find((entry) => entry.operation === operation && entry.recordId === recordId);

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

const removeQueuedEntry = async (operation: SyncQueueEntry['operation'], recordId: string) => {
  const existingEntry = await findQueuedEntry(operation, recordId);
  if (existingEntry?.id) {
    await db.syncQueue.delete(existingEntry.id);
  }
};

const buildLocalItem = async (id: string, payload: ItemMutationPayload, existingItem?: CachedItem): Promise<CachedItem> => {
  const itemType = await db.itemTypes.get(payload.itemTypeId);
  const parent = payload.parentItemId ? await db.items.get(payload.parentItemId) : undefined;

  return normalizeItem({
    id,
    name: payload.name,
    description: payload.description ?? '',
    itemTypeId: payload.itemTypeId,
    itemType: itemType ?? existingItem?.itemType,
    uniqueCode: existingItem?.uniqueCode ?? '',
    tags: payload.tags ?? existingItem?.tags ?? [],
    imagePath: payload.imagePath ?? existingItem?.imagePath,
    parentItemId: payload.parentItemId,
    parent: toParentReference(parent),
    addedAt: existingItem?.addedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
  });
};

const writeItemsMap = async (itemsMap: Map<string, CachedItem>, syncTimestamp?: string) => {
  await replaceStoredItems(Array.from(itemsMap.values()), syncTimestamp);
};

const applyServerCreatedItem = async (tempId: string, item: CachedItem) => {
  const itemsMap = await readAllItemsMap();
  itemsMap.delete(tempId);
  itemsMap.set(item.id, normalizeItem(item));
  await writeItemsMap(itemsMap);
};

const revertItem = async (item?: CachedItem) => {
  const itemsMap = await readAllItemsMap();

  if (item) {
    itemsMap.set(item.id, normalizeItem(item));
  }

  await writeItemsMap(itemsMap);
};

export const applyItemChanges = async (changes: CachedItem[], syncTimestamp: string) => {
  const itemsMap = await readAllItemsMap();

  changes.forEach((change) => {
    const normalizedChange = normalizeItem(change);
    if (normalizedChange.deleted) {
      itemsMap.delete(normalizedChange.id);
      return;
    }

    itemsMap.set(normalizedChange.id, normalizedChange);
  });

  await writeItemsMap(itemsMap, syncTimestamp);
};

export const getCachedItems = async () => {
  const items = await db.items.toArray();
  return items.map(normalizeItem);
};

export const getCachedItemById = async (id: string) => {
  const item = await db.items.get(id);
  return item ? normalizeItem(item) : undefined;
};

export const replaceCachedItems = async (items: CachedItem[]) => {
  await replaceStoredItems(items, new Date().toISOString());
};

export const syncItemsFromServer = async () => {
  const since = (await db.settings.get(SYNC_KEYS.items))?.value;
  const response = await getItemsSync(since);
  const payload = response.data as { data?: CachedItem[]; syncTimestamp?: string; Data?: CachedItem[]; SyncTimestamp?: string };
  const items = (payload.data ?? payload.Data ?? []).map(normalizeItem);
  const syncTimestamp = payload.syncTimestamp ?? payload.SyncTimestamp ?? new Date().toISOString();
  await applyItemChanges(items, syncTimestamp);
  return items;
};

export const createItemRecord = async (payload: ItemMutationPayload) => {
  const tempId = createTempId();
  const localItem = await buildLocalItem(tempId, payload);
  const itemsMap = await readAllItemsMap();
  itemsMap.set(tempId, localItem);
  await writeItemsMap(itemsMap);

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'item', operation: 'create', recordId: tempId, payload });
    return localItem;
  }

  try {
    const response = await createItem(payload);
    await applyServerCreatedItem(tempId, response.data as CachedItem);
    return response.data as CachedItem;
  } catch (error) {
    if (isServerError(error)) {
      const revertedItems = await readAllItemsMap();
      revertedItems.delete(tempId);
      await writeItemsMap(revertedItems);
      throw error;
    }

    await putQueuedEntry({ entity: 'item', operation: 'create', recordId: tempId, payload });
    return localItem;
  }
};

export const updateItemRecord = async (id: string, payload: ItemMutationPayload) => {
  const previousItem = await getCachedItemById(id);
  if (!previousItem) {
    throw new Error(`Item ${id} not found in local cache.`);
  }

  const nextItem = await buildLocalItem(id, payload, previousItem);
  const itemsMap = await readAllItemsMap();
  itemsMap.set(id, nextItem);
  await writeItemsMap(itemsMap);

  const pendingCreate = await findQueuedEntry('create', id);
  if (pendingCreate?.id) {
    await db.syncQueue.update(pendingCreate.id, { payload: { ...(pendingCreate.payload as ItemMutationPayload), ...payload } });
    return nextItem;
  }

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'item', operation: 'update', recordId: id, payload });
    return nextItem;
  }

  try {
    await updateItem(id, payload);
    return nextItem;
  } catch (error) {
    if (isServerError(error)) {
      await revertItem(previousItem);
      throw error;
    }

    await putQueuedEntry({ entity: 'item', operation: 'update', recordId: id, payload });
    return nextItem;
  }
};

export const deleteItemRecord = async (id: string) => {
  const previousItem = await getCachedItemById(id);
  if (!previousItem) {
    return;
  }

  const itemsMap = await readAllItemsMap();
  itemsMap.delete(id);
  await writeItemsMap(itemsMap);

  const pendingCreate = await findQueuedEntry('create', id);
  if (pendingCreate?.id) {
    await db.syncQueue.delete(pendingCreate.id);
    return;
  }

  await removeQueuedEntry('update', id);

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'item', operation: 'delete', recordId: id, payload: null });
    return;
  }

  try {
    await deleteItem(id);
  } catch (error) {
    if (isServerError(error)) {
      await revertItem(previousItem);
      throw error;
    }

    await putQueuedEntry({ entity: 'item', operation: 'delete', recordId: id, payload: null });
  }
};

export const replayQueuedItemMutation = async (entry: SyncQueueEntry) => {
  if (entry.operation === 'create') {
    await createItem(entry.payload);
    await db.items.delete(entry.recordId);
    return;
  }

  if (entry.operation === 'update') {
    await updateItem(entry.recordId, entry.payload);
    return;
  }

  await deleteItem(entry.recordId);
};