"use client";

import { useEffect, useState, useCallback } from "react";

type CateringStatus = "PENDING" | "IN_REVIEW" | "CONFIRMED" | "CANCELLED";

interface CateringRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget: string | null;
  notes: string | null;
  status: CateringStatus;
  createdAt: string;
}

const statusColors: Record<CateringStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<CateringStatus, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In review",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

interface Props {
  adminKey: string;
}

export default function CateringPanel({ adminKey }: Props) {
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/catering", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) {
        setError("Failed to load catering requests.");
        return;
      }
      const data = await response.json();
      setRequests(data.cateringRequests ?? []);
    } catch {
      setError("Failed to load catering requests.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(id: string, status: CateringStatus) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/catering/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r)),
        );
      }
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm("Are you sure you want to delete this catering request?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/catering/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  if (!adminKey) {
    return (
      <p className="text-sm text-slate-500">
        Enter your admin key above to view catering requests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Catering Requests{" "}
          {!loading && (
            <span className="text-sm font-normal text-slate-500">
              ({requests.length})
            </span>
          )}
        </h2>
        <button
          onClick={() => void fetchRequests()}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && requests.length === 0 && !error && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No catering requests yet.
        </p>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{req.customerName}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[req.status]}`}
                  >
                    {statusLabels[req.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {req.customerEmail}
                  {req.customerPhone ? ` · ${req.customerPhone}` : ""}
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>Submitted {new Date(req.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Event type</p>
                <p className="mt-0.5 font-medium text-slate-900">{req.eventType}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Event date</p>
                <p className="mt-0.5 font-medium text-slate-900">
                  {new Date(req.eventDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Guest count</p>
                <p className="mt-0.5 font-medium text-slate-900">
                  {req.guestCount} guest{req.guestCount !== 1 ? "s" : ""}
                </p>
              </div>
              {req.budget && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">Budget</p>
                  <p className="mt-0.5 font-medium text-slate-900">{req.budget}</p>
                </div>
              )}
            </div>

            {req.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="text-xs font-medium text-slate-500">Notes</p>
                <p className="mt-0.5 text-slate-700">{req.notes}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Update status:</span>
              {(["PENDING", "IN_REVIEW", "CONFIRMED", "CANCELLED"] as const).map((s) => (
                <button
                  key={s}
                  disabled={req.status === s || updatingId === req.id}
                  onClick={() => void updateStatus(req.id, s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                    req.status === s
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {statusLabels[s]}
                </button>
              ))}
              <button
                disabled={deletingId === req.id}
                onClick={() => void deleteRequest(req.id)}
                className="ml-auto rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                {deletingId === req.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
