export const isOnline = () => {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
};

export const addConnectivityListener = (
  eventName: 'online' | 'offline',
  listener: () => void,
) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(eventName, listener);

  return () => {
    window.removeEventListener(eventName, listener);
  };
};