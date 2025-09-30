// src/components/ui/ConnectionRequestsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Users, Check, XCircle, RotateCcw, MessageSquare } from "lucide-react";
import { connectionsApi, type ConnectionRequest, type Direction } from "../../lib/api/connections";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

/**
 * Feature flags while backend endpoints are being merged:
 * Toggle these to true when the corresponding backend routes are available.
 *
 * Accept:  POST /connections/requests/:id/accept
 * Decline: POST /connections/requests/:id/decline
 */
const HAS_ACCEPT = false;   // set to true when accept route is live
const HAS_DECLINE = false;  // set to true when decline route is live

const ConnectionRequestsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Direction>("incoming");

  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [pageIncoming, setPageIncoming] = useState(1);
  const [pageOutgoing, setPageOutgoing] = useState(1);
  const [totalIncoming, setTotalIncoming] = useState(0);
  const [totalOutgoing, setTotalOutgoing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const activeList = tab === "incoming" ? incoming : outgoing;
  const activeTotal = tab === "incoming" ? totalIncoming : totalOutgoing;
  const activePage = tab === "incoming" ? pageIncoming : pageOutgoing;

  const hasMore = useMemo(() => {
    const totalPages = Math.ceil(activeTotal / PAGE_SIZE);
    return activePage < totalPages;
  }, [activeTotal, activePage]);

  // Helpers
  const getInitials = (name?: string) =>
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  // Reset state when opening
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setTab("incoming");
    setIncoming([]);
    setOutgoing([]);
    setPageIncoming(1);
    setPageOutgoing(1);
    setTotalIncoming(0);
    setTotalOutgoing(0);
  }, [isOpen]);

  // Fetch on open and on tab/page changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "incoming") {
          const data = await connectionsApi.listRequests("incoming", pageIncoming, PAGE_SIZE);
          setIncoming((prev) => (pageIncoming === 1 ? data.results : [...prev, ...data.results]));
          setTotalIncoming(data.pagination.total);
        } else {
          const data = await connectionsApi.listRequests("outgoing", pageOutgoing, PAGE_SIZE);
          setOutgoing((prev) => (pageOutgoing === 1 ? data.results : [...prev, ...data.results]));
          setTotalOutgoing(data.pagination.total);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, tab, pageIncoming, pageOutgoing]);

  const openProfile = (handle: string | undefined) => {
    if (!handle) return;
    navigate(`/profile/${handle}`);
    onClose();
  };

  const setActionBusy = (id: string, busy: boolean) =>
    setActionLoading((m) => ({ ...m, [id]: busy }));

  // Optimistic update helpers
  const removeFromIncoming = (requestId: string) =>
    setIncoming((list) => list.filter((r) => r.requestId !== requestId));

  const removeFromOutgoing = (requestId: string) =>
    setOutgoing((list) => list.filter((r) => r.requestId !== requestId));

  const onAccept = async (req: ConnectionRequest) => {
    if (!HAS_ACCEPT) {
      setError("Accept endpoint not available yet.");
      return;
    }
    setActionBusy(req.requestId, true);
    try {
      await connectionsApi.accept!(req.requestId);
      removeFromIncoming(req.requestId);
      setTotalIncoming((t) => Math.max(0, t - 1));
    } catch (e: any) {
      const msg =
        e?.status === 404
          ? "Accept endpoint not available yet."
          : e?.message || "Failed to accept request.";
      setError(msg);
    } finally {
      setActionBusy(req.requestId, false);
    }
  };

  const onDecline = async (req: ConnectionRequest) => {
    if (!HAS_DECLINE) {
      setError("Decline endpoint not available yet.");
      return;
    }
    setActionBusy(req.requestId, true);
    try {
      await connectionsApi.decline!(req.requestId);
      removeFromIncoming(req.requestId);
      setTotalIncoming((t) => Math.max(0, t - 1));
    } catch (e: any) {
      const msg =
        e?.status === 404
          ? "Decline endpoint not available yet."
          : e?.message || "Failed to decline request.";
      setError(msg);
    } finally {
      setActionBusy(req.requestId, false);
    }
  };

  const onCancel = async (req: ConnectionRequest) => {
    setActionBusy(req.requestId, true);
    try {
      await connectionsApi.cancel(req.requestId);
      removeFromOutgoing(req.requestId);
      setTotalOutgoing((t) => Math.max(0, t - 1));
    } catch (e: any) {
      setError(e?.message || "Failed to cancel request.");
    } finally {
      setActionBusy(req.requestId, false);
    }
  };

  const RequestRow: React.FC<{ req: ConnectionRequest; direction: Direction }> = ({
    req,
    direction,
  }) => {
    const other = direction === "incoming" ? req.fromProfile : req.toProfile;

    const initials = getInitials(other.fullName);
    const name = other.fullName || "Unknown user";
    const handle = other.handle || "";

    return (
      <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex-shrink-0">
          {other.photoUrl ? (
            <img
              src={other.photoUrl}
              alt={name}
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
                onClick={() => openProfile(other.handle)}
                title={name}
              >
                {name}
              </div>
              {handle && <div className="text-sm text-gray-600 truncate">@{handle}</div>}
              {other.headline && (
                <div className="text-sm text-gray-700 mt-1 truncate">
                  {other.headline}
                </div>
              )}

              {/* Message bubble */}
              {req.message ? (
                <div className="mt-3">
                  <div className="inline-flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span className="whitespace-pre-wrap break-words">
                      {req.message}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="ml-2 flex items-center gap-2 shrink-0">
              {direction === "incoming" ? (
                <>
                  {HAS_ACCEPT && (
                    <button
                      onClick={() => onAccept(req)}
                      disabled={!!actionLoading[req.requestId]}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  )}
                  {HAS_DECLINE && (
                    <button
                      onClick={() => onDecline(req)}
                      disabled={!!actionLoading[req.requestId]}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onCancel(req)}
                  disabled={!!actionLoading[req.requestId]}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Requested {new Date(req.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  const renderList = (direction: Direction) => {
    const list = direction === "incoming" ? incoming : outgoing;
    const total = direction === "incoming" ? totalIncoming : totalOutgoing;
    const emptyText =
      direction === "incoming"
        ? "No incoming requests"
        : "No outgoing requests";

    if (loading && list.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg bg-white animate-pulse">
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
      );
    }

    if (list.length === 0) {
      return (
        <div className="py-16 text-center">
          <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <div className="text-gray-600">{emptyText}</div>
        </div>
      );
    }

    return (
      <>
        <div className="text-sm text-gray-600 mb-3">
          {total} {direction} request{total === 1 ? "" : "s"}
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {list.map((req) => (
            <RequestRow key={req.requestId} req={req} direction={direction} />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() =>
                  tab === "incoming"
                    ? setPageIncoming((p) => p + 1)
                    : setPageOutgoing((p) => p + 1)
                }
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Connection Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setTab("incoming")}
              className={`px-4 py-2 text-sm ${
                tab === "incoming" ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Incoming
            </button>
            <button
              onClick={() => setTab("outgoing")}
              className={`px-4 py-2 text-sm border-l border-gray-300 ${
                tab === "outgoing" ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Outgoing
            </button>
          </div>
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
          {tab === "incoming" ? renderList("incoming") : renderList("outgoing")}
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequestsModal;
