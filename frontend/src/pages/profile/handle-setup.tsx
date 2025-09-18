import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, ProfileApiError } from "../../lib/api/profile";
import { TextInput } from "../../components/ui/TextInput";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function HandleSetupPage() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const debouncedHandle = useDebounce(handle, 500);

  // Validate handle format
  const validateHandle = useCallback((handle: string): string | null => {
    if (handle.length === 0) return null;
    if (handle.length < 3) return "Handle must be at least 3 characters long";
    if (handle.length > 30)
      return "Handle must be no more than 30 characters long";
    if (!/^[a-z0-9._-]+$/.test(handle)) {
      return "Handle can only contain lowercase letters, numbers, dots, underscores, and hyphens";
    }
    if (handle !== handle.toLowerCase()) {
      return "Handle must be lowercase";
    }
    return null;
  }, []);

  // Check availability when debounced handle changes
  useEffect(() => {
    const checkAvailability = async () => {
      const validation = validateHandle(debouncedHandle);
      setValidationError(validation);

      if (validation || !debouncedHandle) {
        setIsAvailable(null);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        const available = await profileApi.checkHandleAvailability(
          debouncedHandle
        );
        setIsAvailable(available);
      } catch (error) {
        console.error("Failed to check handle availability:", error);
        setIsAvailable(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [debouncedHandle, validateHandle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateHandle(handle);
    if (validation) {
      setValidationError(validation);
      return;
    }

    if (isAvailable !== true) {
      setError("Please choose an available handle");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await profileApi.updateHandle(handle);
      navigate(`/profile/${response.handle}`);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.code === "HANDLE_TAKEN") {
          setError(
            "This handle is no longer available. Please choose another one."
          );
          setIsAvailable(false);
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to create handle. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIndicator = () => {
    if (!handle || validationError) return null;

    if (isCheckingAvailability) {
      return (
        <div className="flex items-center text-yellow-600">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Checking availability...
        </div>
      );
    }

    if (isAvailable === true) {
      return (
        <div className="flex items-center text-green-600">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Available
        </div>
      );
    }

    if (isAvailable === false) {
      return (
        <div className="flex items-center text-red-600">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Not available
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--dark-red)] to-[#8B1538] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Create Your Handle</h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Choose a unique handle to create your profile. This will be your
            public identifier in the PPIA UNSW community.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert message={error} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <TextInput
              id="handle"
              label="Handle"
              type="text"
              value={handle}
              onChange={setHandle}
              error={validationError || undefined}
              placeholder="e.g., john.doe, jane_smith, alex123"
              required
              maxLength={30}
              className="text-gray-900"
            />

            {/* Status Indicator */}
            <div className="mt-2 min-h-[1.25rem]">{getStatusIndicator()}</div>

            {/* Handle Preview */}
            {handle && !validationError && (
              <div className="mt-2">
                <p className="text-xs text-white/60">
                  Your profile will be available at:
                  <span className="text-white font-mono">
                    {" "}
                    /profile/{handle}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-white/5 rounded-md p-4">
            <h3 className="text-sm font-medium text-white mb-2">
              Handle Guidelines:
            </h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• 3-30 characters long</li>
              <li>
                • Lowercase letters, numbers, dots, underscores, hyphens only
              </li>
              <li>• Must be unique across all users</li>
              <li>• Cannot be changed once created</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSaving || isAvailable !== true || !!validationError}
            >
              {isSaving ? "Creating Handle..." : "Create Handle"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/")}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Once created, your handle cannot be changed. Choose wisely!
          </p>
        </div>
      </div>
    </div>
  );
}
