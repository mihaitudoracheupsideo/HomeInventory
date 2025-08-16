export const Action = {
    ADD: 'ADD',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    UPDATE: 'UPDATE'
} as const;

export type Action = typeof Action[keyof typeof Action];

export const DataType = {
    ITEM: 'ITEM',
    ITEM_TYPE: 'ITEM_TYPE',
}

export type DataType = typeof DataType[keyof typeof DataType];