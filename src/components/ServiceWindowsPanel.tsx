"use client";

import { FormEvent, useEffect, useState } from "react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ServiceWindow = {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  cutoffMinutes: number;
  isPickup: boolean;
  isDelivery: boolean;
  isActive: boolean;
};

type Props = {
  adminKey: string;
};

export default function ServiceWindowsPanel({ adminKey }: Props) {
  const [windows, setWindows] = useState<ServiceWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [openTime, setOpenTime] = useState("11:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [cutoffMinutes, setCutoffMinutes] = useState(60);
  const [isPickup, setIsPickup] = useState(true);
  const [isDelivery, setIsDelivery] = useState(true);

  async function loadWindows() {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-windows", {
        headers: { "x-admin-key": adminKey },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load service windows.");
      } else {
        setWindows(data.windows ?? []);
      }
    } catch {
      setError("Could not load service windows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  async function createWindow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/service-windows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        dayOfWeek,
        openTime,
        closeTime,
        slotDurationMinutes: slotDuration,
        cutoffMinutes,
        isPickup,
        isDelivery,
        isActive: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create service window.");
      return;
    }

    setSuccess(`Service window created for ${DAY_NAMES[dayOfWeek]}.`);
    await loadWindows();
  }

  async function toggleActive(win: ServiceWindow) {
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/service-windows/${win.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ isActive: !win.isActive }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update service window.");
      return;
    }

    setSuccess(`Service window ${data.window.isActive ? "activated" : "deactivated"}.`);
    await loadWindows();
  }

  async function deleteWindow(id: string) {
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/service-windows/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not delete service window.");
      return;
    }

    setSuccess("Service window deleted.");
    await loadWindows();
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Service Window</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure available delivery and pickup hours for each day of the week.
          Customers can book scheduled slots within these windows.
        </p>
        <form onSubmit={createWindow} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Day of week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {DAY_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">Opens at</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">Closes at</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Slot duration (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Cutoff time (minutes before slot)
            </label>
            <input
              type="number"
              min={0}
              max={1440}
              value={cutoffMinutes}
              onChange={(e) => setCutoffMinutes(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDelivery}
                onChange={(e) => setIsDelivery(e.target.checked)}
                className="rounded"
              />
              Available for delivery
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPickup}
                onChange={(e) => setIsPickup(e.target.checked)}
                className="rounded"
              />
              Available for pickup
            </label>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            Add service window
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {/* List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Configured Service Windows</h2>
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
          <button
            type="button"
            onClick={() => void loadWindows()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Refresh
          </button>
        </div>

        {windows.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-slate-600">
            No service windows configured. Add one above to enable scheduled ordering.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {windows.map((win) => (
              <div
                key={win.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                  win.isActive ? "border-slate-200" : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {DAY_NAMES[win.dayOfWeek]}: {win.openTime} – {win.closeTime}
                  </p>
                  <p className="text-xs text-slate-600">
                    {win.slotDurationMinutes}-min slots · cutoff {win.cutoffMinutes} min
                  </p>
                  <div className="mt-1 flex gap-2">
                    {win.isDelivery && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Delivery
                      </span>
                    )}
                    {win.isPickup && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        Pickup
                      </span>
                    )}
                    {win.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(win)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                      win.isActive ? "bg-orange-600" : "bg-emerald-700"
                    }`}
                  >
                    {win.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteWindow(win.id)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
