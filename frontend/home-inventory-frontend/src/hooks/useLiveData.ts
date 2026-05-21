import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/indexedDb';
import type { IItem } from '../types/IItem';

const filterItemsBySearch = (items: IItem[], searchTerm: string) => {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  if (!normalizedSearch) {
    return items;
  }

  return items.filter((item) => {
    const haystacks = [
      item.name,
      item.description,
      item.uniqueCode,
      item.itemType?.name,
      ...(item.tags ?? []),
      item.parent?.name,
    ];

    return haystacks.some((value) =>
      typeof value === 'string' && value.toLocaleLowerCase().includes(normalizedSearch),
    );
  });
};

const sortItems = (items: IItem[]) =>
  items.slice().sort((left, right) => left.name.localeCompare(right.name, 'ro'));

export const useItems = (searchTerm = '') =>
  useLiveQuery(async () => {
    const items = await db.items.toArray();
    return filterItemsBySearch(sortItems(items), searchTerm);
  }, [searchTerm], []);

export const useItemById = (id?: string) =>
  useLiveQuery(async () => {
    if (!id) {
      return null;
    }

    return (await db.items.get(id)) ?? null;
  }, [id], null);

export const useItemTypes = () =>
  useLiveQuery(async () => db.itemTypes.orderBy('name').toArray(), [], []);

export const useTags = () =>
  useLiveQuery(async () => db.tags.orderBy('name').toArray(), [], []);

export const useSyncState = () =>
  useLiveQuery(async () => {
    const [state, lastMessage, lastAttempt] = await Promise.all([
      db.settings.get('sync:state'),
      db.settings.get('sync:lastMessage'),
      db.settings.get('sync:lastAttempt'),
    ]);

    return {
      state: state?.value ?? 'idle',
      message: lastMessage?.value ?? '',
      lastAttempt: lastAttempt?.value ?? '',
    };
  }, [], { state: 'idle', message: '', lastAttempt: '' });