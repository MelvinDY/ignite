import { useState, useRef } from "react";
import { Camera, Trash2, User } from "lucide-react";
import { profileApi, ProfileApiError } from "../lib/api/profile";

interface ProfilePictureUploadProps {
  currentPhotoUrl: string | null;
  isOwnProfile?: boolean;
  onPhotoUpdate?: (newPhotoUrl: string | null) => void;
}

export function ProfilePictureUpload({
  currentPhotoUrl,
  isOwnProfile = false,
  onPhotoUpdate,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const response = await profileApi.uploadProfilePicture(file);
      onPhotoUpdate?.(response.photoUrl);
      setShowOptions(false);
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      await profileApi.deleteProfilePicture();
      onPhotoUpdate?.(null);
      setShowOptions(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        setError(err.message || "Failed to delete profile picture");
      } else {
        setError("An error occurred while deleting");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <div className="relative w-32 h-32 lg:w-40 lg:h-40">
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
            <User className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400" />
          </div>
        )}

        {isOwnProfile && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            disabled={uploading || deleting}
          >
            <Camera className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* Options dropdown */}
      {showOptions && isOwnProfile && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10 min-w-[180px]">
          <button
            onClick={handleUploadClick}
            disabled={uploading || deleting}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload new photo"}
          </button>

          {currentPhotoUrl && (
            <button
              onClick={handleDelete}
              disabled={uploading || deleting}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Removing..." : "Remove photo"}
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || deleting}
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 text-red-600 text-sm p-2 rounded-md">
          {error}
        </div>
      )}

      {/* Click outside to close */}
      {showOptions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}