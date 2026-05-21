import type { IItemType } from './IItemType'

export interface IItem {
  id: string;
  name: string;
  description: string;
  itemTypeId: string;
  itemType?: IItemType;
  parentItemId?: string;
  parent?: IItem;
  children?: IItem[];
  uniqueCode?: string;
  tags: string[];
  imagePath?: string;
  nodeIndex?: number;
  path?: string;
  depth?: number;
  addedAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  childrenCount?: number;
}