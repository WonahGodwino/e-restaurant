"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import AdminOrdersPanel from "@/components/AdminOrdersPanel";
import NotificationPanel from "@/components/NotificationPanel";
import UserManagementPanel from "@/components/UserManagementPanel";
import AuditLogViewer from "@/components/AuditLogViewer";
import NotificationDashboard from "@/components/NotificationDashboard";
import ReservationsPanel from "@/components/ReservationsPanel";
import CateringPanel from "@/components/CateringPanel";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("adminKey") ?? "";
  });

  const [activeTab, setActiveTab] = useState<
    "menu" | "orders" | "notifications" | "notif-dashboard" | "reservations" | "catering" | "users" | "audit"
  >(
    "menu"
  );
  const [selectedUserId, setSelectedUserId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("selectedUserId") ?? "";
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let disposed = false;

    const loadUnreadCount = async () => {
      if (!adminKey || !selectedUserId) {
        if (!disposed) {
          setUnreadCount(0);
        }
        return;
      }

      try {
        const response = await fetch(`/api/admin/notifications?userId=${selectedUserId}`, {
          headers: { "x-admin-key": adminKey },
        });

        if (!response.ok) {
          if (!disposed) {
            setUnreadCount(0);
          }
          return;
        }

        const data = await response.json();
        if (!disposed) {
          setUnreadCount(Array.isArray(data.notifications) ? data.notifications.length : 0);
        }
      } catch {
        if (!disposed) {
          setUnreadCount(0);
        }
      }
    };

    const initial = setTimeout(() => {
      void loadUnreadCount();
    }, 0);
    const interval = setInterval(() => {
      void loadUnreadCount();
    }, 5000);

    return () => {
      disposed = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [adminKey, selectedUserId]);

  return (
    <div className="admin-light-ui mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-950/85 px-6 py-8 text-white shadow-[0_18px_40px_rgba(2,6,23,0.4)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Restaurant Admin</h1>
          <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
            <span aria-hidden="true" className="text-lg">🔔</span>
            <span className="text-sm font-semibold">{unreadCount}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-200">
          Manage menu items, monitor stock, set notifications, manage users, reservations and catering requests.
        </p>
      </header>

      {/* Admin Key Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Access</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={adminKey}
            onChange={(event) => {
              setAdminKey(event.target.value);
              localStorage.setItem("adminKey", event.target.value);
            }}
            placeholder="Enter ADMIN_DASHBOARD_KEY"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => localStorage.setItem("adminKey", adminKey)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Save key
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          onClick={() => setActiveTab("menu")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "menu"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "orders"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "notifications"
              ? "bg-orange-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Stock & Notifications
        </button>
        <button
          onClick={() => setActiveTab("notif-dashboard")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "notif-dashboard"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Notif Dashboard {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "reservations"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Reservations
        </button>
        <button
          onClick={() => setActiveTab("catering")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "catering"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Catering
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "audit"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "menu" && <AdminDashboard adminKey={adminKey} />}
      {activeTab === "orders" && <AdminOrdersPanel adminKey={adminKey} />}
      {activeTab === "notifications" && <NotificationPanel adminKey={adminKey} />}
      {activeTab === "notif-dashboard" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Select User to View Notifications:
            </label>
            <input
              type="text"
              placeholder="Enter user ID (or paste from users list)"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                localStorage.setItem("selectedUserId", e.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          {selectedUserId && (
            <NotificationDashboard adminKey={adminKey} userId={selectedUserId} />
          )}
        </div>
      )}
      {activeTab === "reservations" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ReservationsPanel adminKey={adminKey} />
        </div>
      )}
      {activeTab === "catering" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CateringPanel adminKey={adminKey} />
        </div>
      )}
      {activeTab === "users" && <UserManagementPanel adminKey={adminKey} />}
      {activeTab === "audit" && <AuditLogViewer adminKey={adminKey} />}
    </div>
  );
}
