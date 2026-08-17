"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { queryKeys } from "@/api/query-keys";
import { apiBaseUrl } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

type StreamState = "connecting" | "live" | "fallback";

function parseEventBlock(block: string): { data?: string; event?: string } {
  const result: { data?: string; event?: string } = {};
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) result.event = line.slice(6).trim();
    if (line.startsWith("data:")) result.data = `${result.data ?? ""}${line.slice(5).trim()}`;
  }
  return result;
}

export function useCheckNotificationStream() {
  const [state, setState] = useState<StreamState>("connecting");
  const queryClient = useQueryClient();
  const session = useAuthStore((store) => store.session);

  useEffect(() => {
    if (!session?.accessToken) return;
    const controller = new AbortController();
    const connect = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/notifications/stream`, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${session.accessToken}`,
            ...(session.tenantId ? { __tenant: session.tenantId } : {}),
          },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("stream-unavailable");
        setState("live");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() ?? "";
          for (const block of blocks) {
            const event = parseEventBlock(block);
            if (event.event !== "api-contract-checker-notification" || !event.data) continue;
            const payload = JSON.parse(event.data) as { entityId?: string };
            void queryClient.invalidateQueries({ queryKey: queryKeys.checks.all });
            if (payload.entityId) {
              void queryClient.invalidateQueries({ queryKey: queryKeys.checks.status(payload.entityId) });
              void queryClient.invalidateQueries({ queryKey: queryKeys.checks.detail(payload.entityId) });
            }
          }
        }
        if (!controller.signal.aborted) setState("fallback");
      } catch {
        if (!controller.signal.aborted) setState("fallback");
      }
    };
    void connect();
    return () => controller.abort();
  }, [queryClient, session?.accessToken, session?.tenantId]);

  return state;
}
