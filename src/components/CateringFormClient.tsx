"use client";

import { useState } from "react";

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  budget: string;
  notes: string;
};

const initialState: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  eventType: "",
  eventDate: "",
  guestCount: "",
  budget: "",
  notes: "",
};

const eventTypes = [
  "Corporate event",
  "Wedding",
  "Birthday celebration",
  "Private dining",
  "Cultural event",
  "Office lunch",
  "Fundraiser",
  "Other",
];

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CateringFormClient() {
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

    const guestCount = parseInt(form.guestCount, 10);
    if (isNaN(guestCount) || guestCount < 1) {
      setError("Please enter a valid guest count.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guestCount }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not submit your catering enquiry.");
        return;
      }

      setSuccess(payload.message ?? "Your catering enquiry has been received.");
      setForm(initialState);
    } catch {
      setError("Could not submit your catering enquiry. Please try again.");
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
        <span className="mb-2 block text-sm font-medium text-white/74">Event type</span>
        <select
          required
          value={form.eventType}
          onChange={(e) => updateField("eventType", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
        >
          <option value="" disabled>Select event type</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Event date</span>
        <input
          required
          type="date"
          min={getTodayDateString()}
          value={form.eventDate}
          onChange={(e) => updateField("eventDate", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Expected guest count</span>
        <input
          required
          type="number"
          min={1}
          max={10000}
          value={form.guestCount}
          onChange={(e) => updateField("guestCount", e.target.value)}
          placeholder="Number of guests"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-white/74">Budget (optional)</span>
        <input
          value={form.budget}
          onChange={(e) => updateField("budget", e.target.value)}
          placeholder="e.g. £500–£1,000, or flexible"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-white/74">Additional notes</span>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Dietary requirements, menu preferences, venue details, any other information..."
          rows={5}
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
        {submitting ? "Submitting enquiry..." : "Submit catering enquiry"}
      </button>
    </form>
  );
}
