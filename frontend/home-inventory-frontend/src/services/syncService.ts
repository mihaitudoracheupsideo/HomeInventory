import { replayQueuedItemMutation, syncItemsFromServer } from '../repositories/itemRepository';
import { replayQueuedItemTypeMutation, syncItemTypesFromServer } from '../repositories/itemTypeRepository';
import { replayQueuedTagMutation, syncTagsFromServer } from '../repositories/tagRepository';
import { db, type SyncQueueEntry } from '../storage/indexedDb';
import { addConnectivityListener, isOnline } from '../utils/network';

let initialized = false;
let syncInFlight: Promise<void> | null = null;
let queueInFlight: Promise<void> | null = null;

const updateSyncStatus = async (state: 'idle' | 'syncing' | 'error', message?: string) => {
  await db.settings.bulkPut([
    { key: 'sync:state', value: state },
    { key: 'sync:lastAttempt', value: new Date().toISOString() },
    { key: 'sync:lastMessage', value: message ?? '' },
  ]);
};

const processQueueEntry = async (entry: SyncQueueEntry) => {
  switch (entry.entity) {
    case 'item':
      await replayQueuedItemMutation(entry);
      return;

    case 'itemType':
      await replayQueuedItemTypeMutation(entry);
      return;

    case 'tag':
      await replayQueuedTagMutation(entry);
      return;
  }
};

export const processSyncQueue = async () => {
  if (queueInFlight) {
    return queueInFlight;
  }

  if (!isOnline()) {
    return;
  }

  queueInFlight = (async () => {
    const queueEntries = await db.syncQueue.orderBy('id').toArray();

    for (const entry of queueEntries) {
      if (!entry.id) {
        continue;
      }

      await processQueueEntry(entry);
      await db.syncQueue.delete(entry.id);
    }
  })();

  try {
    await queueInFlight;
  } finally {
    queueInFlight = null;
  }
};

export const syncAllEntities = async () => {
  if (syncInFlight) {
    return syncInFlight;
  }

  if (!isOnline()) {
    await updateSyncStatus('idle', 'offline');
    return;
  }

  syncInFlight = (async () => {
    await updateSyncStatus('syncing');

    try {
      await processSyncQueue();
      await Promise.all([
        syncItemTypesFromServer(),
        syncTagsFromServer(),
        syncItemsFromServer(),
      ]);
      await updateSyncStatus('idle', 'ok');
    } catch (error) {
      console.error('Background sync failed', error);
      await updateSyncStatus('error', error instanceof Error ? error.message : 'unknown');
      throw error;
    }
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
};

export const initializeSyncService = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  void syncAllEntities();

  addConnectivityListener('online', () => {
    void syncAllEntities();
  });

  addConnectivityListener('offline', () => {
    void updateSyncStatus('idle', 'offline');
  });
};