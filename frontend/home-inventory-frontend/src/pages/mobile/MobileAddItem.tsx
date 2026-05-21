import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { uploadImage } from "../../api/imageService";
// import type { IItem } from "../../types/IItem";
import { Button } from "../../components/ui/button";
import { Input, Textarea } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import { useItemTypes } from "../../hooks/useLiveData";
import { createItemRecord } from "../../repositories/itemRepository";
import toast from "react-hot-toast";
import {
  Camera,
  X,
  Save,
  CheckCircle,
  Package,
  Tag,
  ImageIcon,
  ArrowLeft,
  Smartphone,
  Download
} from "lucide-react";

const MobileAddItemPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdItem, setCreatedItem] = useState<any>(null);
  const itemTypes = useItemTypes() ?? [];

  // PWA Install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle PWA install
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Aplicația a fost instalată!');
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    itemTypeId: "",
    tags: [] as string[],
    tagsInput: ""
  });

  useEffect(() => {
    if (itemTypes.length > 0 && !formData.itemTypeId) {
      setFormData((prev) => ({ ...prev, itemTypeId: itemTypes[0].id }));
    }
  }, [itemTypes, formData.itemTypeId]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Eroare la accesarea camerei");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImages(prev => [...prev, imageDataUrl]);
        stopCamera();
        toast.success("Poză capturată!");
      }
    }
  }, [stopCamera]);

  // Remove captured image
  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCapturedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (capturedImages.length === 0) return [];

    setIsUploading(true);
    const uploadedPaths: string[] = [];

    try {
      for (const imageDataUrl of capturedImages) {
        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();

        // Create form data
        const formData = new FormData();
        formData.append('file', blob, `item-${Date.now()}.jpg`);
        formData.append('size', 'original');

        // TODO: Fix image upload - requires uniqueCode which we don't have yet
        // // Upload image
        // const uploadResponse = await uploadImage(formData);
        // if (uploadResponse.data?.path) {
        //   uploadedPaths.push(uploadResponse.data.path);
        // }
      }

      toast.success(`${uploadedPaths.length} imagini încărcate!`);
      return uploadedPaths;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Eroare la încărcarea imaginilor");
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Handle tags input
  const handleTagsChange = (value: string) => {
    setFormData(prev => ({ ...prev, tagsInput: value }));
    // Process tags immediately for better UX
    const processedTags = value
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags: processedTags }));
  };

  // Save item
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Numele obiectului este obligatoriu");
      return;
    }

    if (!formData.itemTypeId) {
      toast.error("Tipul obiectului este obligatoriu");
      return;
    }

    setIsSaving(true);

    try {
      // Upload images first
      const imagePaths = await uploadImages();

      // Create item
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        itemTypeId: formData.itemTypeId,
        tags: formData.tags,
        imagePath: imagePaths.length > 0 ? imagePaths[0] : null, // Use first image as main image
      };

      const createdItem = await createItemRecord(itemData);

      setCreatedItem(createdItem);
      setShowSuccess(true);
      toast.success("Obiect adăugat cu succes!");

      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Eroare la crearea obiectului");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      itemTypeId: itemTypes.length > 0 ? itemTypes[0].id : "",
      tags: [],
      tagsInput: ""
    });
    setCapturedImages([]);
    setShowSuccess(false);
    setCreatedItem(null);
  };

  // Handle back navigation
  const handleBack = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Adaugă Obiect
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Install Prompt */}
        {showInstallPrompt && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Instalează aplicația
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Adaugă HomeInventory pe ecranul principal pentru acces rapid
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Instalează
                  </Button>
                  <Button
                    onClick={() => setShowInstallPrompt(false)}
                    size="sm"
                    variant="outline"
                  >
                    Mai târziu
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showSuccess && createdItem ? (
          /* Success Screen */
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Obiect adăugat cu succes!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {createdItem.name}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Cod QR generat
              </h3>
              <QRCodeDisplay value={createdItem.uniqueCode} size={150} />
            </div>

            <Button
              onClick={resetForm}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg"
            >
              Adaugă alt obiect
            </Button>
          </div>
        ) : (
          /* Add Item Form */
          <div className="space-y-6">
            {/* Camera Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Fotografiază obiectul
                </h3>
              </div>

              {isCameraActive ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-black"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      size="lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturează
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={startCamera}
                    className="w-full bg-blue-500 hover:bg-blue-600 py-4 text-lg"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Deschide Camera
                  </Button>

                  <div className="text-center">
                    <span className="text-gray-500 dark:text-gray-400">sau</span>
                  </div>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full py-4 text-lg"
                    size="lg"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Alege din Galerie
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Captured Images Preview */}
              {capturedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Imagini capturate ({capturedImages.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Item Details Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Detalii obiect
                </h3>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="mobileName" className="text-sm font-medium">
                  Nume obiect *
                </Label>
                <Input
                  id="mobileName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Laptop Dell XPS 13"
                  className="text-base py-3"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="mobileDescription" className="text-sm font-medium">
                  Descriere
                </Label>
                <Textarea
                  id="mobileDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descriere detaliată..."
                  rows={3}
                  className="text-base"
                />
              </div>

              {/* Item Type */}
              <div className="space-y-2">
                <Label htmlFor="mobileItemType" className="text-sm font-medium">
                  Tip obiect *
                </Label>
                <select
                  id="mobileItemType"
                  value={formData.itemTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemTypeId: e.target.value }))}
                  className="w-full px-3 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {itemTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="mobileTags" className="text-sm font-medium">
                  Etichete (separate prin virgulă sau spațiu)
                </Label>
                <Input
                  id="mobileTags"
                  value={formData.tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="ex: electronic, birou, important"
                  className="text-base py-3"
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading || !formData.name.trim()}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold disabled:opacity-50"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Se salvează...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Se încarcă imaginile...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvează obiectul
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mobile indicator */}
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
        <Smartphone className="w-3 h-3" />
        Mobile
      </div>
    </div>
  );
};

export default MobileAddItemPage;