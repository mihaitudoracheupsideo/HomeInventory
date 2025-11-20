import { api } from "./api";

export const uploadImage = (file: File, uniqueCode: string, maxWidth?: number, maxHeight?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uniqueCode', uniqueCode);
  if (maxWidth) formData.append('maxWidth', maxWidth.toString());
  if (maxHeight) formData.append('maxHeight', maxHeight.toString());

  return api.post("/images/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getImageUrl = (imagePath: string) => {
  return `${api.defaults.baseURL}/images/${imagePath}`;
};