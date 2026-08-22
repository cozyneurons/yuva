"use client";

import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/lib/ws-context";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center pulse-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-indigo-400">{unreadCount} new</span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">
                All caught up 🎉
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors",
                    !n.is_read && "bg-indigo-500/5"
                  )}
                >
                  <p className="text-sm text-gray-200 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(n.created_at)}
                  </p>
                  {!n.is_read && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
