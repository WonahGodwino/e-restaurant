"use client";

import { useEffect, useState, useCallback } from "react";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  partySize: number;
  date: string;
  time: string;
  specialRequests: string | null;
  status: ReservationStatus;
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

const statusColors: Record<ReservationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

interface Props {
  adminKey: string;
}

export default function ReservationsPanel({ adminKey }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [decisionReasonById, setDecisionReasonById] = useState<Record<string, string>>({});

  const fetchReservations = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/reservations", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) {
        setError("Failed to load reservations.");
        return;
      }
      const data = await response.json();
      const incoming = (data.reservations ?? []) as Reservation[];
      setReservations(incoming);
      setDecisionReasonById(
        Object.fromEntries(incoming.map((reservation) => [reservation.id, reservation.decisionReason ?? ""])),
      );
    } catch {
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void fetchReservations();
  }, [fetchReservations]);

  async function updateStatus(id: string, status: ReservationStatus) {
    const decisionReason = (decisionReasonById[id] ?? "").trim();
    if (status === "CANCELLED" && decisionReason.length < 5) {
      setError("Please provide a rejection reason (at least 5 characters) before rejecting a reservation.");
      return;
    }

    setUpdatingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ status, decisionReason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...(payload.reservation ?? { status }) } : r)),
        );
        const nextReason = payload.reservation?.decisionReason ?? (status === "CANCELLED" ? decisionReason : "");
        setDecisionReasonById((prev) => ({ ...prev, [id]: nextReason }));
      } else {
        const fieldErrors = payload.details?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors as Record<string, string[]>).flat()[0]
          : undefined;
        setError(firstFieldError ?? payload.error ?? "Failed to update reservation status.");
      }
    } catch {
      setError("Failed to update reservation status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteReservation(id: string) {
    if (!confirm("Are you sure you want to delete this reservation?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (response.ok) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
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
        Enter your admin key above to view reservations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Reservations{" "}
          {!loading && (
            <span className="text-sm font-normal text-slate-500">
              ({reservations.length})
            </span>
          )}
        </h2>
        <button
          onClick={() => void fetchReservations()}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && reservations.length === 0 && !error && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No reservation requests yet.
        </p>
      )}

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900">
                    {reservation.customerName}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[reservation.status]}`}
                  >
                    {reservation.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {reservation.customerEmail}
                  {reservation.customerPhone ? ` · ${reservation.customerPhone}` : ""}
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>Submitted {new Date(reservation.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Date &amp; Time</p>
                <p className="mt-0.5 font-medium text-slate-900">
                  {new Date(reservation.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at {reservation.time}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Party size</p>
                <p className="mt-0.5 font-medium text-slate-900">
                  {reservation.partySize} guest{reservation.partySize !== 1 ? "s" : ""}
                </p>
              </div>
              {reservation.specialRequests && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500">Special requests</p>
                  <p className="mt-0.5 text-slate-700">{reservation.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Update status:</span>
              {(["PENDING", "CONFIRMED", "CANCELLED"] as const).map((s) => (
                <button
                  key={s}
                  disabled={reservation.status === s || updatingId === reservation.id}
                  onClick={() => void updateStatus(reservation.id, s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                    reservation.status === s
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
              <button
                disabled={deletingId === reservation.id}
                onClick={() => void deleteReservation(reservation.id)}
                className="ml-auto rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                {deletingId === reservation.id ? "Deleting..." : "Delete"}
              </button>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Rejection reason (required only when rejecting)
              </label>
              <textarea
                value={decisionReasonById[reservation.id] ?? ""}
                onChange={(event) =>
                  setDecisionReasonById((prev) => ({
                    ...prev,
                    [reservation.id]: event.target.value,
                  }))
                }
                rows={2}
                placeholder="E.g. No availability at requested time; alternative slots are 19:30 or 20:00."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {(reservation.decisionReason || reservation.decidedAt) && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-medium text-slate-800">Latest decision</p>
                {reservation.decidedAt && (
                  <p className="text-xs text-slate-500">
                    {new Date(reservation.decidedAt).toLocaleString("en-GB")}
                  </p>
                )}
                {reservation.decisionReason && (
                  <p className="mt-1">{reservation.decisionReason}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
