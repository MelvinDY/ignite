import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Briefcase, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SearchProfile, SearchResponse } from "../../lib/api/search";
import {
  connectionsApi,
  ConnectionsApiError,
} from "../../lib/api/connections";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResponse | null;
  loading: boolean;
  error: string | null;
  /** Used to hide your own profile from results */
  currentProfileId?: string;
}

type RelationshipStatus = {
  connected: boolean;
  pendingOutgoing: boolean;
  pendingIncoming: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
  canSendRequest: boolean;
};

const CONCURRENCY = 5;

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchResults,
  loading,
  error,
  currentProfileId,
}) => {
  const navigate = useNavigate();

  // per-card state
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const [perCardError, setPerCardError] = useState<Record<string, string>>({});

  // status cache: profileId -> RelationshipStatus
  const [statusMap, setStatusMap] = useState<Record<string, RelationshipStatus>>(
    {}
  );
  const statusAbortRef = useRef<AbortController | null>(null);

  // mini “compose message” modal state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTarget, setComposeTarget] = useState<SearchProfile | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [composeSubmitting, setComposeSubmitting] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  // hide my own profile if BE returns it
  const filteredResults: SearchProfile[] = useMemo(() => {
    const list = searchResults?.results ?? [];
    if (!currentProfileId) return list;
    return list.filter((p) => p.id !== currentProfileId);
  }, [searchResults, currentProfileId]);

  const totalFound = useMemo(() => {
    const total = searchResults?.pagination.total ?? 0;
    if (!searchResults || !currentProfileId) return total;
    const includesMe = searchResults.results.some((r) => r.id === currentProfileId);
    return total - (includesMe ? 1 : 0);
  }, [searchResults, currentProfileId]);

  // reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStatusMap({});
      setPerCardError({});
      setRequesting({});
      setComposeOpen(false);
      setComposeTarget(null);
      setComposeMessage("");
      setComposeError(null);
      if (statusAbortRef.current) {
        statusAbortRef.current.abort();
        statusAbortRef.current = null;
      }
    }
  }, [isOpen]);

  // Fetch relationship status for visible profiles (chunked)
  useEffect(() => {
    if (!isOpen) return;
    if (!filteredResults.length) return;

    // Abort previous run if still in-flight
    if (statusAbortRef.current) statusAbortRef.current.abort();
    const ctrl = new AbortController();
    statusAbortRef.current = ctrl;

    const run = async () => {
      // Only fetch for ones we don't already have
      const toFetch = filteredResults
        .map((p) => p.id)
        .filter((id) => id && !statusMap[id]);

      if (!toFetch.length) return;

      // process in batches
      for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
        if (ctrl.signal.aborted) return;
        const chunk = toFetch.slice(i, i + CONCURRENCY);

        try {
          const results = await Promise.all(
            chunk.map(async (id) => {
              try {
                const s = await connectionsApi.getStatus(id);
                return { id, s };
              } catch {
                // If it fails, default to "can send" so UI stays usable.
                const fallback: RelationshipStatus = {
                  connected: false,
                  pendingOutgoing: false,
                  pendingIncoming: false,
                  blockedByMe: false,
                  blockedMe: false,
                  canSendRequest: true,
                };
                return { id, s: fallback };
              }
            })
          );
          if (ctrl.signal.aborted) return;
          setStatusMap((m) => {
            const next = { ...m };
            for (const { id, s } of results) next[id] = s;
            return next;
          });
        } catch {
          // ignore a batch failure; the per-item fallback above already covers most cases
        }
      }
    };

    void run();

    return () => {
      ctrl.abort();
    };
    // Intentionally DO include statusMap in deps? No: would re-run after each set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filteredResults]);

  if (!isOpen) return null;

  const handleProfileClick = (profile: SearchProfile) => {
    if (profile.handle) {
      navigate(`/profile/${profile.handle}`);
      onClose();
    }
  };

  /** Open the compose modal before sending */
  const openCompose = (profile: SearchProfile) => {
    setComposeTarget(profile);
    setComposeMessage("");
    setComposeError(null);
    setComposeOpen(true);
  };

  /** Actually submit the request to the backend */
  const submitConnectRequest = async () => {
    if (!composeTarget) return;
    const id = composeTarget.id;
    if (!id) return;

    // block if status says we can't send
    const status = statusMap[id];
    if (status && !status.canSendRequest) {
      setComposeError("You can’t send a request to this profile.");
      return;
    }
    if (status?.connected || status?.pendingOutgoing) {
      setComposeOpen(false);
      return;
    }

    setComposeSubmitting(true);
    setPerCardError((m) => ({ ...m, [id]: "" }));
    setRequesting((m) => ({ ...m, [id]: true }));

    try {
      await connectionsApi.sendRequest(id, composeMessage.trim() || undefined);

      // Optimistically mark as "pendingOutgoing"
      setStatusMap((m) => ({
        ...m,
        [id]: {
          connected: false,
          pendingOutgoing: true,
          pendingIncoming: false,
          blockedByMe: false,
          blockedMe: false,
          canSendRequest: false,
        },
      }));

      setComposeOpen(false);
    } catch (err) {
      let msg = "Failed to send request.";
      if (err instanceof ConnectionsApiError) {
        if (err.status === 401) msg = "Please sign in to connect.";
        else if (err.status === 409) {
          msg = "Request already sent or already connected.";
          // reflect that in status
          setStatusMap((m) => ({
            ...m,
            [id]: {
              connected: false,
              pendingOutgoing: true,
              pendingIncoming: false,
              blockedByMe: false,
              blockedMe: false,
              canSendRequest: false,
            },
          }));
          setComposeOpen(false);
        } else if (err.status === 429) msg = "Too many requests. Try again later.";
        else msg = err.message;
      }
      setPerCardError((m) => ({ ...m, [id]: msg }));
      setComposeError(msg);
    } finally {
      setComposeSubmitting(false);
      setRequesting((m) => ({ ...m, [id]: false }));
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");

  const ProfileCard: React.FC<{ profile: SearchProfile }> = ({ profile }) => {
    const id = profile.id;
    const isSending = !!requesting[id];
    const errMsg = perCardError[id];
    const st = statusMap[id];

    const isConnected = !!st?.connected;
    const isRequested = !!st?.pendingOutgoing;
    const isPendingYou = !!st?.pendingIncoming;
    const canSend = st ? st.canSendRequest : true;

    let buttonText = "Connect";
    if (isConnected) buttonText = "Connected";
    else if (isRequested) buttonText = "Requested";
    else if (isPendingYou) buttonText = "Pending you";
    else if (!canSend) buttonText = "Unavailable";

    const disabled =
      isSending || isConnected || isRequested || isPendingYou || !canSend;

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleProfileClick(profile)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-lg">
                {getInitials(profile.fullName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {profile.fullName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">@{profile.handle}</p>

                {profile.headline && (
                  <div className="flex items-center gap-1 text-sm text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{profile.headline}</span>
                  </div>
                )}

                {(profile.domicileCity || profile.domicileCountry) && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {[profile.domicileCity, profile.domicileCountry]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}

                {profile.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {errMsg && (
                  <div className="mt-2 text-sm text-red-600">{errMsg}</div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) openCompose(profile);
                }}
                disabled={disabled}
                className={`ml-4 px-4 py-2 text-sm rounded-md transition-colors
                  ${
                    disabled
                      ? "bg-gray-200 text-gray-800 cursor-default"
                      : "bg-[#7C0B2B] text-white hover:bg-[#7C0B2B]/90"
                  }`}
                aria-busy={isSending}
                title={
                  disabled && !isSending ? buttonText : "Send connection request"
                }
              >
                {isSending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  buttonText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();

    if (error) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-red-500 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      );
    }

    if (!filteredResults || filteredResults.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {searchResults?.pagination.page} of{" "}
            {searchResults?.pagination.totalPages}
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredResults.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        {searchResults && searchResults.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4 border-t border-gray-200">
            <button
              disabled={searchResults.pagination.page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-800 bg-white"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {searchResults.pagination.page} of{" "}
              {searchResults.pagination.totalPages}
            </span>

            <button
              disabled={
                searchResults.pagination.page >=
                searchResults.pagination.totalPages
              }
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-800 bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({Math.max(totalFound, 0)})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">{renderContent()}</div>
        </div>
      </div>

      {/* Compose message modal */}
      {composeOpen && composeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect with {composeTarget.fullName}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setComposeOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="text-sm text-gray-700 font-medium">
                Add a message <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                maxLength={300}
                rows={4}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#7C0B2B] focus:border-transparent bg-white"
                placeholder="Tell them why you'd like to connect (max 300 chars)…"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{composeMessage.length}/300</span>
                {composeError && (
                  <span className="text-red-600">{composeError}</span>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-800 bg-white hover:bg-gray-50"
                disabled={composeSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitConnectRequest}
                disabled={composeSubmitting}
                className="px-4 py-2 rounded-md bg-[#7C0B2B] text-white text-sm hover:bg-[#7C0B2B]/90 disabled:opacity-60"
              >
                {composeSubmitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchModal;
