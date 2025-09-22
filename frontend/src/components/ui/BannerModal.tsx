import { profileApi, ProfileApiError } from "@/lib/api/profile";
import { X } from "lucide-react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
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

    setError(null);
    setUploading(true);
    try {
      const response = await profileApi.uploadBanner(file);
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
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
      >
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || deleting}
        />

        <form onSubmit={() => {}} className="px-5 py-4 space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--dark-red)] px-4 py-2 font-medium text-white hover:bg-[var(--dark-red)]/90 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BannerModal };
