import { profileApi, ProfileApiError } from "@/lib/api/profile";
import { getCroppedImg } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import React, {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Cropper from "react-easy-crop";

interface BannerModalProps {
  open: boolean;
  onClose: () => void;
  formError: string | null;
  banner: string;
  setBanner: Dispatch<SetStateAction<string>>;
}

const BannerModal = ({
  open,
  onClose,
  formError,
  banner,
  setBanner,
}: BannerModalProps) => {
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [newBanner, setNewBanner] = useState<string>(banner);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setNewBanner(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const handleFileUpload = async () => {
    if (!newBanner || !croppedAreaPixels) return;
    
    const croppedImage = await getCroppedImg(newBanner, croppedAreaPixels);
    setError(null);
    setUploading(true);

    try {
      const response = await profileApi.uploadBanner(croppedImage);
      setBanner(response.bannerUrl);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        setError(err.message || "Failed to upload profile picture");
      } else {
        setError("An error occurred while uploading");
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
      >
        {/* Error message */}
        {error && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 text-red-600 text-sm p-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">Change cover</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* File input */}
        <div className="px-5">
          <input
            id="bannerUpload" 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || deleting}
            className="hidden"
          />
          <label
            htmlFor="bannerUpload"
            className="flex items-center justify-center my-4 rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50 cursor-pointer w-fit"
          >
            <Upload className="size-4 inline mr-2" />
            Upload file
          </label>
        </div>

        {newBanner && (
          <div className="relative w-auto h-[200px] bg-gray-200">
            <Cropper
              image={newBanner}
              crop={crop}
              zoom={zoom}
              aspect={3} // 3 : 1 aspect ratio
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={false}
            />
          </div>
        )}

        <form 
        onSubmit={handleFileUpload} 
        className="px-5 py-4 space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
                type="button"
                // onClick={}
                className={
                  banner 
                  ? "rounded-md px-4 py-2 font-medium text-white disabled:opacity-60 bg-red-600 hover:bg-red-700"
                  : "invisible"}
              >
                Delete
              </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[var(--dark-red)] px-4 py-2 font-medium text-white hover:bg-[var(--dark-red)]/90 disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BannerModal };
