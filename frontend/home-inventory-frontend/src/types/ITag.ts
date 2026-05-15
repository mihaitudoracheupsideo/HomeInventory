export const TagType = {
  Generic: 0,
  Category: 1,
  Brand: 2,
  Location: 3,
  Feature: 4,
  Status: 5,
  Collection: 6,
} as const;

export type TagType = typeof TagType[keyof typeof TagType];

export interface ITag {
  id: string;
  name: string;
  normalizedName: string;
  type: TagType;
  color?: string | null;
  icon?: string | null;
  usageCount?: number;
  canDelete?: boolean;
}

export interface ITagPayload {
  name: string;
  type: TagType;
  color?: string | null;
  icon?: string | null;
}

export const TAG_TYPE_OPTIONS: Array<{ value: TagType; label: string }> = [
  { value: TagType.Generic, label: 'Generic' },
  { value: TagType.Category, label: 'Category' },
  { value: TagType.Brand, label: 'Brand' },
  { value: TagType.Location, label: 'Location' },
  { value: TagType.Feature, label: 'Feature' },
  { value: TagType.Status, label: 'Status' },
  { value: TagType.Collection, label: 'Collection' },
];