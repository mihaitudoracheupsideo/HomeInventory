import type { IItemType } from './IItemType'

export interface IItem {
  id: string;
  name: string;
  description: string;
  itemTypeId: string;
  itemType?: IItemType;
  parentId?: string;
  parent?: IItem;
  children?: IItem[];
  uniqueCode?: string;
  tags: string[];
  imagePath?: string;
}