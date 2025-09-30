import React, { useEffect, useState, useMemo } from "react";
import { X, Users, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { connectionsApi, type MiniProfile } from "../../lib/api/connections";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

const ConnectionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [connections, setConnections] = useState<MiniProfile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const hasMore = useMemo(() => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return page < totalPages;
  }, [total, page]);

  const getInitials = (name?: string) =>
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setConnections([]);
    setPage(1);
    setTotal(0);
    setError(null);
  }, [isOpen]);

  // Fetch connections
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await connectionsApi.listConnections(page, PAGE_SIZE);
        setConnections((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
        setTotal(data.pagination.total);
      } catch (e: any) {
        setError(e?.message || "Failed to load connections.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, page]);

  const setActionBusy = (id: string, busy: boolean) =>
    setActionLoading((m) => ({ ...m, [id]: busy }));

  const openProfile = (handle?: string) => {
    if (!handle) return;
    navigate(`/profile/${handle}`);
    onClose();
  };

  const onRemove = async (profile: MiniProfile) => {
    if (!window.confirm(`Are you sure you want to remove your connection with ${profile.fullName}?`)) {
      return;
    }
    setActionBusy(profile.id, true);
    try {
      await connectionsApi.removeConnection(profile.id);
      setConnections((list) => list.filter((c) => c.id !== profile.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      setError(e?.message || "Failed to remove connection.");
    } finally {
      setActionBusy(profile.id, false);
    }
  };

  const ConnectionRow: React.FC<{ profile: MiniProfile }> = ({ profile }) => {
    const initials = getInitials(profile.fullName);

    return (
      <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex-shrink-0">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="font-medium text-gray-900 hover:underline cursor-pointer truncate"
                onClick={() => openProfile(profile.handle)}
                title={profile.fullName}
              >
                {profile.fullName}
              </div>
              {profile.handle && (
                <div className="text-sm text-gray-600 truncate">@{profile.handle}</div>
              )}
              {profile.headline && (
                <div className="text-sm text-gray-700 mt-1 truncate">{profile.headline}</div>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(profile)}
              disabled={!!actionLoading[profile.id]}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-sm hover:bg-red-100 disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              Unconnect
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Your Connections</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 mt-3">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {loading && connections.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 rounded-lg bg-white animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <div className="text-gray-600">No connections yet</div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-3">
                {total} connection{total === 1 ? "" : "s"}
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {connections.map((c) => (
                  <ConnectionRow key={c.id} profile={c} />
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsModal;
