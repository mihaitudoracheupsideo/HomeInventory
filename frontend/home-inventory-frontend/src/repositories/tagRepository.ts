import {
  createTag,
  deleteTag,
  getTagsSync,
  updateTag,
} from '../api/tagService';
import { db, SYNC_KEYS, type CachedTag, type SyncQueueEntry } from '../storage/indexedDb';
import { isOnline } from '../utils/network';
import { TagType, type ITagPayload } from '../types/ITag';

const TEMP_TAG_PREFIX = 'temp:tag:';

const createTempId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${TEMP_TAG_PREFIX}${crypto.randomUUID()}`;
  }

  return `${TEMP_TAG_PREFIX}${Date.now()}`;
};

const isServerError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'response' in error;

const normalizeTag = (tag: CachedTag): CachedTag => ({
  ...tag,
  normalizedName: tag.normalizedName ?? tag.name.toLocaleUpperCase(),
  updatedAt: tag.updatedAt ?? new Date().toISOString(),
  deleted: tag.deleted ?? false,
});

const readTagsMap = async () => new Map((await db.tags.toArray()).map((tag) => [tag.id, normalizeTag(tag)]));

const writeTagsMap = async (tagsMap: Map<string, CachedTag>, syncTimestamp?: string) => {
  const values = Array.from(tagsMap.values()).map(normalizeTag);
  await db.tags.clear();

  if (values.length > 0) {
    await db.tags.bulkPut(values);
  }

  if (syncTimestamp) {
    await db.settings.put({ key: SYNC_KEYS.tags, value: syncTimestamp });
  }
};

const findQueuedEntry = async (operation: SyncQueueEntry['operation'], recordId: string) =>
  (await db.syncQueue.toArray()).find((entry) =>
    entry.entity === 'tag' &&
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

export const getCachedTags = async () => {
  const tags = await db.tags.orderBy('name').toArray();
  return tags.map(normalizeTag);
};

export const replaceCachedTags = async (tags: CachedTag[]) => {
  const map = new Map(tags.map((tag) => [tag.id, normalizeTag(tag)]));
  await writeTagsMap(map, new Date().toISOString());
};

export const syncTagsFromServer = async () => {
  const since = (await db.settings.get(SYNC_KEYS.tags))?.value;
  const response = await getTagsSync(since);
  const payload = response.data as { data?: CachedTag[]; syncTimestamp?: string; Data?: CachedTag[]; SyncTimestamp?: string };
  const tags = (payload.data ?? payload.Data ?? []).map(normalizeTag);
  const syncTimestamp = payload.syncTimestamp ?? payload.SyncTimestamp ?? new Date().toISOString();
  const map = await readTagsMap();
  tags.forEach((tag) => {
    if (tag.deleted) {
      map.delete(tag.id);
      return;
    }

    map.set(tag.id, tag);
  });
  await writeTagsMap(map, syncTimestamp);
  return tags;
};

export const createTagRecord = async (payload: ITagPayload) => {
  const tempId = createTempId();
  const localTag = normalizeTag({
    id: tempId,
    name: payload.name,
    normalizedName: payload.name.toLocaleUpperCase(),
    type: payload.type ?? TagType.Generic,
    color: payload.color,
    icon: payload.icon,
    usageCount: 0,
    canDelete: true,
  });
  const map = await readTagsMap();
  map.set(tempId, localTag);
  await writeTagsMap(map);

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'tag', operation: 'create', recordId: tempId, payload });
    return localTag;
  }

  try {
    const response = await createTag(payload);
    map.delete(tempId);
    map.set((response.data as CachedTag).id, normalizeTag(response.data as CachedTag));
    await writeTagsMap(map);
    return response.data as CachedTag;
  } catch (error) {
    if (isServerError(error)) {
      map.delete(tempId);
      await writeTagsMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'tag', operation: 'create', recordId: tempId, payload });
    return localTag;
  }
};

export const updateTagRecord = async (id: string, payload: ITagPayload) => {
  const map = await readTagsMap();
  const previousTag = map.get(id);
  if (!previousTag) {
    throw new Error(`Tag ${id} not found in local cache.`);
  }

  const nextTag = normalizeTag({ ...previousTag, ...payload, id, normalizedName: payload.name.toLocaleUpperCase() });
  map.set(id, nextTag);
  await writeTagsMap(map);

  const pendingCreate = await findQueuedEntry('create', id);
  if (pendingCreate?.id) {
    await db.syncQueue.update(pendingCreate.id, { payload: { ...(pendingCreate.payload as ITagPayload), ...payload } });
    return nextTag;
  }

  if (!isOnline()) {
    await putQueuedEntry({ entity: 'tag', operation: 'update', recordId: id, payload });
    return nextTag;
  }

  try {
    const response = await updateTag(id, payload);
    map.set(id, normalizeTag(response.data as CachedTag));
    await writeTagsMap(map);
    return response.data as CachedTag;
  } catch (error) {
    if (isServerError(error)) {
      map.set(id, previousTag);
      await writeTagsMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'tag', operation: 'update', recordId: id, payload });
    return nextTag;
  }
};

export const deleteTagRecord = async (id: string) => {
  const map = await readTagsMap();
  const previousTag = map.get(id);
  if (!previousTag) {
    return;
  }

  map.delete(id);
  await writeTagsMap(map);

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
    await putQueuedEntry({ entity: 'tag', operation: 'delete', recordId: id, payload: null });
    return;
  }

  try {
    await deleteTag(id);
  } catch (error) {
    if (isServerError(error)) {
      map.set(id, previousTag);
      await writeTagsMap(map);
      throw error;
    }

    await putQueuedEntry({ entity: 'tag', operation: 'delete', recordId: id, payload: null });
  }
};

export const replayQueuedTagMutation = async (entry: SyncQueueEntry) => {
  if (entry.operation === 'create') {
    await createTag(entry.payload as ITagPayload);
    await db.tags.delete(entry.recordId);
    return;
  }

  if (entry.operation === 'update') {
    await updateTag(entry.recordId, entry.payload as ITagPayload);
    return;
  }

  await deleteTag(entry.recordId);
};