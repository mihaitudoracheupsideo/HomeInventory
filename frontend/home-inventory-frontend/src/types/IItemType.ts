export interface IItemType {
  id: string;
  name: string;
  description: string;
  icon?: string;
  canContainItems?: boolean;
  isLeaf?: boolean;
  color?: string;
  sortOrder?: number;
}