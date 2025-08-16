export const Action = {
    ADD: 'ADD',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    UPDATE: 'UPDATE'
} as const;

export type Action = typeof Action[keyof typeof Action];