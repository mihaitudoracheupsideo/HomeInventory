export const extractCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const dataProp = (payload as Record<string, unknown>).data ??
      (payload as Record<string, unknown>).Data;

    if (Array.isArray(dataProp)) {
      return dataProp as T[];
    }
  }

  return [];
};

export const extractSingle = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload as T;
};

export const extractTotalCount = (payload: unknown, fallback = 0) => {
  if (payload && typeof payload === 'object') {
    const totalCount = (payload as Record<string, unknown>).totalCount ??
      (payload as Record<string, unknown>).TotalCount;

    if (typeof totalCount === 'number') {
      return totalCount;
    }
  }

  return fallback;
};