// Utility functions for generating unique codes and other helpers

export const generateUniqueCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isValidUniqueCode = (code: string): boolean => {
  return /^[A-Z0-9]{8}$/.test(code);
};