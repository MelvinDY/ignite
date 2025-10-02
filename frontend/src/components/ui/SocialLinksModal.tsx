// src/components/ui/SocialLinksModal.tsx
import React from "react";
import { X, ExternalLink } from "lucide-react";

type Links = Record<string, string> | null | undefined;

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: Links;
  handle: string | null; // for Ignite profile URL
}

const normalizeKey = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const SocialLinksModal: React.FC<SocialLinksModalProps> = ({
  isOpen,
  onClose,
  links,
  handle,
}) => {
  if (!isOpen) return null;

  // Build Ignite URL (hide if no handle yet)
  const igniteUrl =
    handle ? `https://ignite.com/profile/${encodeURIComponent(handle)}` : null;

  const entries = Object.entries(links || {}).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0
  );

  const hasAny = entries.length > 0 || !!igniteUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {!hasAny ? (
            <div className="text-gray-600 text-sm">
              No social links yet. Add them from <span className="font-medium">Edit Profile</span>.
            </div>
          ) : (
            <ul className="divide-y">
              {igniteUrl && (
                <li className="py-3">
                  <a
                    href={igniteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-gray-900 font-medium">Ignite</span>
                    <span className="inline-flex items-center gap-2 text-[var(--dark-red)] group-hover:underline">
                      {igniteUrl}
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                </li>
              )}
              {entries.map(([k, v]) => (
                <li key={k} className="py-3">
                  <a
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-gray-900 font-medium">
                      {normalizeKey(k)}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[var(--dark-red)] group-hover:underline">
                      {v}
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-800 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
