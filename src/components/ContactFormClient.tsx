"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "General enquiry",
  message: "",
};

export default function ContactFormClient() {
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

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not send your message.");
        return;
      }

      setSuccess(payload.message ?? "Your enquiry has been sent.");
      setForm(initialState);
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Full name</span>
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Full name"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Email</span>
        <input
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Phone</span>
        <input
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="Phone"
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
        />
      </label>

      <label className="sm:col-span-1">
        <span className="mb-2 block text-sm font-medium text-white/74">Subject</span>
        <select
          value={form.subject}
          onChange={(event) => updateField("subject", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
        >
          <option value="General enquiry">General enquiry</option>
          <option value="Delivery support">Delivery support</option>
          <option value="Catering request">Catering request</option>
          <option value="Partnership enquiry">Partnership enquiry</option>
          <option value="Menu or allergen question">Menu or allergen question</option>
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-white/74">Message</span>
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Tell us what you need"
          rows={6}
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
        {submitting ? "Sending enquiry..." : "Send enquiry"}
      </button>
    </form>
  );
}