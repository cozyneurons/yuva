"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

export type Notification = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

type WSContextType = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => void;
  connected: boolean;
};

const WSContext = createContext<WSContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  connected: false,
});

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling fallback ──────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/notifications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data: Notification[] = await res.json();
          setNotifications(data);
        }
      } catch {
        // silent
      }
    }, 20_000); // 20-second poll (fast enough for the "live" requirement)
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    const wsBase = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000").replace(/\/$/, "");
    // Decode user_id from token payload (sub claim)
    let userId: string | null = null;
    try {
      userId = JSON.parse(atob(token.split(".")[1])).sub;
    } catch {
      return;
    }
    const ws = new WebSocket(`${wsBase}/ws/${userId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as Notification;
        setNotifications((prev) => [msg, ...prev]);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setConnected(false);
      // Fall back to polling when WS drops
      startPolling();
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      ws.close();
      startPolling();
    };
  }, [startPolling]);

  useEffect(() => {
    connect();
    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [connect]);

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const token = localStorage.getItem("access_token");
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/notifications/${id}/read`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token ?? ""}` } }
    ).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <WSContext.Provider value={{ notifications, unreadCount, markRead, connected }}>
      {children}
    </WSContext.Provider>
  );
}

export const useNotifications = () => useContext(WSContext);
