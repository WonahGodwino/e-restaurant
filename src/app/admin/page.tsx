"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import NotificationPanel from "@/components/NotificationPanel";
import UserManagementPanel from "@/components/UserManagementPanel";
import OrdersPanel from "@/components/OrdersPanel";
import NotificationDashboard from "@/components/NotificationDashboard";
export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("adminKey") ?? "";
  });

  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "notifications" | "users" | "notif-dashboard">(
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-slate-900 px-6 py-8 text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Restaurant Admin</h1>
          <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
            <span aria-hidden="true" className="text-lg">🔔</span>
            <span className="text-sm font-semibold">{unreadCount}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-200">
          Manage menu items, monitor stock, set notifications, and manage users.
        </p>
      </header>

      {/* Admin Key Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-4 py-3 font-semibold whitespace-nowrap ${
            activeTab === "menu"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-3 font-semibold whitespace-nowrap ${
            activeTab === "orders"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-3 font-semibold whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-b-2 border-orange-600 text-orange-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Stock & Notifications
        </button>
        <button
          onClick={() => setActiveTab("notif-dashboard")}
          className={`px-4 py-3 font-semibold whitespace-nowrap ${
            activeTab === "notif-dashboard"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Notif Dashboard {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-3 font-semibold whitespace-nowrap ${
            activeTab === "users"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Users
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "menu" && <AdminDashboard />}
      {activeTab === "orders" && <OrdersPanel adminKey={adminKey} />}
        {activeTab === "notifications" && <NotificationPanel adminKey={adminKey} />}
      {activeTab === "notif-dashboard" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
          {selectedUserId && (
            <NotificationDashboard adminKey={adminKey} userId={selectedUserId} />
          )}
        </div>
      )}
      {activeTab === "users" && <UserManagementPanel adminKey={adminKey} />}
    </div>
  );
}
