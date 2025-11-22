import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath: string;
  itemName: string;
}

const ImagePreviewModal = ({ isOpen, onClose, imagePath, itemName }: ImagePreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imagine: {itemName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img
            src={`http://localhost:5005/api/images/${imagePath}?t=${Date.now()}`}
            alt={itemName}
            className="max-w-full max-h-[70vh] object-contain rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<p class="text-gray-500 text-center">Imaginea nu a putut fi încărcată</p>';
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;