"use client";

import { useEffect, useState } from "react";

type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  "menu.create": "Menu item created",
  "menu.update": "Menu item updated",
  "stock.topup": "Stock topped up",
  "stock.threshold_update": "Stock threshold updated",
  "user.create": "User created",
  "user.update": "User updated",
  "user.deactivate": "User deactivated",
  "user.import_csv": "Users imported via CSV",
  "order.status_change": "Order status changed",
};

const ACTION_COLOURS: Record<string, string> = {
  "menu.create": "bg-emerald-100 text-emerald-800",
  "menu.update": "bg-blue-100 text-blue-800",
  "stock.topup": "bg-cyan-100 text-cyan-800",
  "stock.threshold_update": "bg-yellow-100 text-yellow-800",
  "user.create": "bg-purple-100 text-purple-800",
  "user.update": "bg-indigo-100 text-indigo-800",
  "user.deactivate": "bg-red-100 text-red-800",
  "user.import_csv": "bg-teal-100 text-teal-800",
  "order.status_change": "bg-orange-100 text-orange-800",
};

type Props = {
  adminKey: string;
};

export default function AuditLogViewer({ adminKey }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [knownActions, setKnownActions] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchLogs(filter = actionFilter) {
    if (!adminKey) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: "200" });
    if (filter) params.set("action", filter);

    try {
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { "x-admin-key": adminKey },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to load audit logs.");
        return;
      }

      const incoming: AuditLogEntry[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs(incoming);
      // Accumulate all action types seen so the dropdown stays populated when filtering
      setKnownActions((prev) => {
        const merged = new Set([...prev, ...incoming.map((l) => l.action)]);
        return Array.from(merged).sort();
      });
    } catch {
      setError("Network error while loading audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const uniqueActions = knownActions;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Audit Log</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              const next = e.target.value;
              setActionFilter(next);
              void fetchLogs(next);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] ?? action}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No audit log entries found.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {logs.map((log) => {
              const colour =
                ACTION_COLOURS[log.action] ?? "bg-slate-100 text-slate-700";
              const label = ACTION_LABELS[log.action] ?? log.action;
              const isExpanded = expandedId === log.id;
              const parsedDetails = log.details
                ? (() => {
                    try {
                      return JSON.parse(log.details) as Record<string, unknown>;
                    } catch {
                      return null;
                    }
                  })()
                : null;

              return (
                <div key={log.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${colour}`}
                      >
                        {label}
                      </span>
                      <span className="font-mono text-xs text-slate-600">{log.target}</span>
                    </div>
                    <time
                      dateTime={log.createdAt}
                      className="shrink-0 text-xs text-slate-400"
                      title={new Date(log.createdAt).toISOString()}
                    >
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Actor: <span className="font-medium text-slate-700">{log.actor}</span>
                  </p>
                  {parsedDetails ? (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {isExpanded ? "Hide details" : "Show details"}
                      </button>
                      {isExpanded ? (
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">
                          {JSON.stringify(parsedDetails, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
