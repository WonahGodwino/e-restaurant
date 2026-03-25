"use client";

import { useState } from "react";

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: string;
  date: string;
  time: string;
  specialRequests: string;
};

const initialState: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  partySize: "2",
  date: "",
  time: "",
  specialRequests: "",
};

// Generate time slots every 30 minutes between 11:00 and 22:00
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 11; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const timeSlots = generateTimeSlots();

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReservationFormClient() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const partySize = parseInt(form.partySize, 10);
    if (isNaN(partySize) || partySize < 1) {
      setError("Please enter a valid party size.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, partySize }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not submit your reservation request.");
        return;
      }

      setSuccess(payload.message ?? "Your reservation request has been received.");
      setForm(initialState);
    } catch {
      setError("Could not submit your reservation request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Full name</span>
        <input
          required
          value={form.customerName}
          onChange={(e) => updateField("customerName", e.target.value)}
          placeholder="Full name"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Email</span>
        <input
          required
          type="email"
          value={form.customerEmail}
          onChange={(e) => updateField("customerEmail", e.target.value)}
          placeholder="Email address"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Phone</span>
        <input
          value={form.customerPhone}
          onChange={(e) => updateField("customerPhone", e.target.value)}
          placeholder="Phone number (optional)"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Party size</span>
        <input
          required
          type="number"
          min={1}
          max={500}
          value={form.partySize}
          onChange={(e) => updateField("partySize", e.target.value)}
          placeholder="Number of guests"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Date</span>
        <input
          required
          type="date"
          min={getTodayDateString()}
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Preferred time</span>
        <select
          required
          value={form.time}
          onChange={(e) => updateField("time", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
        >
          <option value="" disabled>Select a time</option>
          {timeSlots.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-white/74">Special requests</span>
        <textarea
          value={form.specialRequests}
          onChange={(e) => updateField("specialRequests", e.target.value)}
          placeholder="Dietary requirements, accessibility needs, occasion details..."
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      {error ? <p className="sm:col-span-2 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="sm:col-span-2 text-sm text-emerald-300">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] disabled:opacity-60 sm:col-span-2 sm:w-fit"
      >
        {submitting ? "Submitting request..." : "Request reservation"}
      </button>
    </form>
  );
}
