import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { API_BASE_URL } from '../api/api';
import { uploadImage } from '../api/imageService';
import type { IItem } from '../types/IItem';
import { updateItemRecord } from '../repositories/itemRepository';
import { Upload, X, Camera, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: IItem;
  onItemUpdated: (updatedItem: IItem) => void;
}

const ImagePreviewModal = ({ isOpen, onClose, item, onItemUpdated }: ImagePreviewModalProps) => {
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSize, setUploadSize] = useState<'original' | 'resized'>('resized');
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDeleteImage = async () => {
    if (!confirm('Ești sigur că vrei să ștergi imaginea?')) {
      return;
    }

    try {
      const updatedItem = { ...item, imagePath: undefined };
      await updateItemRecord(item.id, {
        name: updatedItem.name,
        description: updatedItem.description,
        itemTypeId: updatedItem.itemTypeId,
        tags: updatedItem.tags ?? [],
        imagePath: undefined,
        parentItemId: updatedItem.parentItemId,
      });
      onItemUpdated(updatedItem);
      toast.success('Imaginea a fost ștearsă cu succes!');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Eroare la ștergerea imaginii');
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Eroare la accesarea camerei');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
          }
        }, 'image/jpeg', 0.8);
      }
    }
    stopCamera();
  }, [stopCamera]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Vă rugăm să selectați o imagine');
      return;
    }

    if (!item.uniqueCode) {
      toast.error('Codul unic al obiectului nu este disponibil');
      return;
    }

    setIsUploading(true);
    try {
      const uploadParams = uploadSize === 'resized'
        ? { maxWidth: 800, maxHeight: 800 }
        : {};

      const response = await uploadImage(selectedFile, item.uniqueCode, uploadParams.maxWidth, uploadParams.maxHeight);
      const updatedItem = { ...item, imagePath: response.data.imagePath };
      await updateItemRecord(item.id, {
        name: updatedItem.name,
        description: updatedItem.description,
        itemTypeId: updatedItem.itemTypeId,
        tags: updatedItem.tags ?? [],
        imagePath: updatedItem.imagePath,
        parentItemId: updatedItem.parentItemId,
      });
      onItemUpdated(updatedItem);
      setSelectedFile(null);
      setShowUploadInterface(false);
      toast.success('Imaginea a fost încărcată cu succes!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Eroare la încărcarea imaginii');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setShowUploadInterface(false);
    setSelectedFile(null);
    setUploadSize('resized');
    setIsUploading(false);
    stopCamera();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showUploadInterface ? 'Încărcare Imagine' : 'Imagine'}: {item.name}
          </DialogTitle>
        </DialogHeader>

        {!showUploadInterface ? (
          // Image Preview Mode
          <>
            <div className="flex justify-center mb-6">
              {item.imagePath ? (
                <img
                  src={`${API_BASE_URL}/api/images/${item.imagePath}?t=${Date.now()}`}
                  alt={item.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-lg">
                          <div class="text-center">
                            <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Imaginea nu a putut fi încărcată</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-lg">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nicio imagine disponibilă</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              {item.imagePath && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteImage}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Șterge imaginea
                </Button>
              )}
              <Button
                variant="default"
                onClick={() => setShowUploadInterface(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {item.imagePath ? 'Schimbă imaginea' : 'Adaugă imagine'}
              </Button>
            </div>
          </>
        ) : (
          // Upload Interface Mode
          <div className="space-y-6">
            {/* Camera Controls */}
            <div className="flex gap-2 justify-center">
              {!isCameraActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Deschide cameră
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={capturePhoto}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Capturează
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Închide cameră
                  </Button>
                </div>
              )}
            </div>

            {/* Camera Video Element */}
            {isCameraActive && (
              <div className="flex justify-center mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-sm mx-auto border rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Size Options */}
            <div className="flex items-center justify-center space-x-6">
              <Label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadSize"
                  value="original"
                  checked={uploadSize === 'original'}
                  onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                  className="text-primary"
                />
                <span className="text-sm">Dimensiune originală</span>
              </Label>
              <Label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadSize"
                  value="resized"
                  checked={uploadSize === 'resized'}
                  onChange={(e) => setUploadSize(e.target.value as 'original' | 'resized')}
                  className="text-primary"
                />
                <span className="text-sm">Redimensionare la 800x800px</span>
              </Label>
            </div>

            {/* File Upload Dropzone */}
            <div className="space-y-3 p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/20">
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                  selectedFile
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                      setSelectedFile(file);
                    } else {
                      toast.error('Vă rugăm să selectați doar fișiere de tip imagine.');
                    }
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    setSelectedFile(file || null);
                  };
                  input.click();
                }}
              >
                <div className="text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Fișier selectat
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-500 dark:text-green-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Șterge
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Trageți și plasați imaginea aici
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          sau faceți clic pentru a selecta
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        PNG, JPG, GIF până la 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">Se încarcă imaginea...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUploadInterface(false)}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isUploading ? 'Se încarcă...' : 'Încarcă imaginea'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;