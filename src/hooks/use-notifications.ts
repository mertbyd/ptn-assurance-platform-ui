"use client";

/**
 * SSE Notifications hook
 * Akış: POST /api/notifications/live/ticket → GET /api/notifications/live/stream?ticket=…
 * Kaynak: NotificationController.cs + NotificationSseItemStream.cs
 */

import { useEffect, useRef, useState } from "react";

import { apiClient, apiBaseUrl } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export interface NotificationEnvelope {
  eventId: string;
  eventName: string;
  payload: unknown;
  occurredAt: string;
}

export type NotificationHandler = (envelope: NotificationEnvelope) => void;

interface UseNotificationsOptions {
  onNotification?: NotificationHandler;
  enabled?: boolean;
}

export function useNotifications({ onNotification, enabled = true }: UseNotificationsOptions = {}) {
  const session = useAuthStore((s) => s.session);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!enabled || !session) return;
    abortRef.current = false;

    let es: EventSource | null = null;

    const connect = async () => {
      // 1. Bearer token ile bilet al
      let ticket: string;
      try {
        const res = await apiClient.post<{ ticket: string }>(
          "/api/notifications/live/ticket",
        );
        ticket = res.ticket;
      } catch {
        return; // session yoksa veya unauthorized ise sessiz çık
      }

      if (abortRef.current) return;

      // 2. SSE bağlantısını aç (EventSource header taşıyamaz, bilet query string'de)
      es = new EventSource(
        `${apiBaseUrl}/api/notifications/live/stream?ticket=${encodeURIComponent(ticket)}`,
      );
      esRef.current = es;

      es.addEventListener("notification", (e: MessageEvent) => {
        try {
          const envelope = JSON.parse(e.data) as NotificationEnvelope;
          onNotification?.(envelope);
        } catch { /* ignore malformed */ }
      });

      es.addEventListener("heartbeat", () => {
        // Sadece bağlantıyı canlı tutar
      });

      es.onopen = () => setConnected(true);

      es.onerror = () => {
        setConnected(false);
        es?.close();
        // 5 saniye sonra yeniden bağlan
        if (!abortRef.current) {
          setTimeout(connect, 5_000);
        }
      };
    };

    connect();

    return () => {
      abortRef.current = true;
      es?.close();
      esRef.current = null;
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, session?.accessToken]);

  return { connected };
}
