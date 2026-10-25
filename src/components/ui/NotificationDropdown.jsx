import React from 'react';
import {
  Bell,
  CheckCheck,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

function formatRelativeTime(dateVal) {
  if (!dateVal) return '';
  const now = new Date();
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'booking_confirmed':
      return <Calendar className="h-4 w-4 text-emerald-400" />;
    case 'payment_submitted':
      return <CreditCard className="h-4 w-4 text-amber-400" />;
    case 'payment_confirmed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'new_message':
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case 'review_received':
      return <Star className="h-4 w-4 text-amber-400 fill-amber-400" />;
    default:
      return <Bell className="h-4 w-4 text-blue-400" />;
  }
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onNotificationClick,
}) {
  if (!isOpen) return null;

  return (
    <div
      id="notification-dropdown-menu"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-zinc-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {onMarkAllRead && (
          <button
            id="mark-all-notifications-read-btn"
            type="button"
            onClick={unreadCount > 0 ? onMarkAllRead : undefined}
            disabled={unreadCount === 0}
            className={`text-xs font-medium transition-colors flex items-center gap-1 ${
              unreadCount > 0
                ? 'text-blue-400 hover:text-blue-300 cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed opacity-40'
            }`}
            title={unreadCount === 0 ? 'No unread notifications' : 'Mark all as read'}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Body: Scrollable list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No new notifications</p>
            <p className="text-xs text-zinc-600">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.is_read;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNotificationClick?.(item)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                  isUnread
                    ? 'bg-blue-950/20 hover:bg-blue-950/30'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                {/* Left status indicator: small blue dot for unread */}
                <div className="pt-1 flex items-center justify-center shrink-0">
                  {isUnread ? (
                    <span
                      className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/80 animate-pulse"
                      title="Unread"
                    />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Event Type Icon badge */}
                <div className="h-8 w-8 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4
                      className={`text-sm truncate ${
                        isUnread ? 'font-bold text-zinc-50' : 'font-semibold text-zinc-300'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-zinc-500 font-mono shrink-0 ml-1">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
