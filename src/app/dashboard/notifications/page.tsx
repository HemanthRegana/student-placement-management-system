'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

type FilterType = 'ALL' | 'UNREAD' | 'READ';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load notifications.');
      }

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading notifications.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    const notification = notifications.find((item) => item._id === id);

    if (!notification || notification.isRead) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Could not mark notification as read.');
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update notification.'
      );
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'UNREAD') return !notification.isRead;
    if (filter === 'READ') return notification.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated on your CampusFlow activities.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchNotifications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total loaded</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">Unread</p>
          <p className="mt-2 text-2xl font-bold text-blue-800">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Read</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {notifications.filter((item) => item.isRead).length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['ALL', 'All'],
              ['UNREAD', 'Unread'],
              ['READ', 'Read'],
            ] as [FilterType, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Showing the latest {notifications.length} notifications
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto mb-4 text-slate-300" size={38} />

            <h2 className="font-semibold text-slate-800">
              {filter === 'UNREAD'
                ? 'No unread notifications'
                : filter === 'READ'
                  ? 'No read notifications'
                  : 'No notifications yet'}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Notifications about your placement activities will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex flex-col gap-4 p-5 transition sm:flex-row sm:items-start sm:justify-between ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50/50'
                }`}
              >
                <div className="flex min-w-0 gap-3">
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      notification.isRead
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {notification.isRead ? (
                      <Check size={19} />
                    ) : (
                      <Bell size={19} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString(
                        'en-IN',
                        {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                  <Link
                    href={notification.link || '/dashboard'}
                    onClick={() => markAsRead(notification._id)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View details
                  </Link>

                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification._id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
                    >
                      <CheckCheck size={15} />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Your notification history is private to your account.
      </p>
    </div>
  );
}