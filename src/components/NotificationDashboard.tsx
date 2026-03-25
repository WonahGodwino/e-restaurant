"use client";

import { useCallback, useEffect, useState } from 'react';

interface Notification {
  id: string;
  type: 'LOW_STOCK' | 'NEW_ORDER' | 'ORDER_STATUS_CHANGE';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  emailSent: boolean;
}

export default function NotificationDashboard({ adminKey, userId }: { adminKey: string; userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!adminKey || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const action = showHistory ? 'history' : '';
      const url = `/api/admin/notifications?userId=${userId}${action ? `&action=${action}` : ''}`;

      const response = await fetch(url, {
        headers: { 'x-admin-key': adminKey },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load notifications');
        return;
      }

      setNotifications(data.notifications || []);
      const unread = data.notifications?.filter((n: Notification) => !n.isRead).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      setError('Failed to load notifications: ' + String(err));
    } finally {
      setLoading(false);
    }
  }, [adminKey, userId, showHistory]);

  // Initial load and polling
  useEffect(() => {
    void loadNotifications();

    // Poll for new notifications every 5 seconds
    const interval = setInterval(() => {
      void loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [adminKey, userId, showHistory, loadNotifications]);

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        setError('Failed to mark as read');
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'border-orange-200 bg-orange-50';
      case 'NEW_ORDER':
        return 'border-blue-200 bg-blue-50';
      case 'ORDER_STATUS_CHANGE':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'LOW_STOCK':
        return '⚠️';
      case 'NEW_ORDER':
        return '📦';
      case 'ORDER_STATUS_CHANGE':
        return '✅';
      default:
        return '📢';
    }
  };

  if (!adminKey || !userId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Please ensure admin key is set and user ID is available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-block rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              showHistory
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            {showHistory ? 'Unread' : 'History'}
          </button>
          <button
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading && notifications.length === 0 ? (
        <p className="text-sm text-slate-600">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-slate-600">
          {showHistory ? 'No notification history' : 'No new notifications'}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative flex gap-3 rounded-lg border p-4 transition-all ${getNotificationColor(
                notification.type
              )} ${!notification.isRead ? 'ring-2 ring-slate-900' : ''}`}
            >
              <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </span>
                  {notification.emailSent && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      📧 Sent
                    </span>
                  )}
                </div>
              </div>
              {!notification.isRead && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
