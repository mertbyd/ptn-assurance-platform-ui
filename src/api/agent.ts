import { notifyUnauthorized, readAuthSession } from "@/lib/auth-storage";

export type AgentMoment = "Grounding" | "Drafting" | "Validation" | "Approval" | "Execution" | "Diagnosis";

export interface AgentSessionDto {
  id: string;
  momentCode: AgentMoment;
  status: string;
  allowedToolCodes: string[];
  maxTurns: number;
  tokenLimit: number;
}

export interface ClosedQuestion {
  questionCode: string;
  prompt: string;
  options: string[];
  gapKindCode?: string;
}

export interface ClosedAnswer {
  questionCode: string;
  selectedOption: string;
}

export interface StepProposal {
  stepId: string;
  operationReferenceId: string;
  requestBodyJson?: string | null;
  assertionPaths: string[];
}

export type AgentEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string }
  | { type: "input_required"; questions: ClosedQuestion[] }
  | { type: "approval_required"; proposal: StepProposal }
  | { type: "completed"; turns: number; tokens: number }
  | { type: "cancelled" }
  | { type: "error"; code: string; message: string };

const agentOrigin = process.env.NEXT_PUBLIC_AGENT_ORIGIN?.trim() || "http://localhost:4310";

export class AgentHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "AgentHttpError";
  }
}

async function agentFetch(path: string, init: RequestInit): Promise<Response> {
  const session = readAuthSession();
  if (!session) throw new Error("Oturum bulunamadı.");
  const response = await fetch(`${agentOrigin}${path}`, {
    ...init,
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (response.status === 401) notifyUnauthorized();
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { code?: string };
    throw new AgentHttpError(response.status, body.code || `agent_http_${response.status}`);
  }
  return response;
}

export const agentApi = {
  startSession: async (momentCode: AgentMoment = "Grounding") => {
    const response = await agentFetch("/api/agent/sessions", {
      method: "POST",
      body: JSON.stringify({ momentCode }),
    });
    return response.json() as Promise<AgentSessionDto>;
  },
  upload: async (sessionId: string, fileName: "senaryo.md" | "kurallar.md", content: string) => {
    await agentFetch(`/api/agent/sessions/${sessionId}/uploads`, {
      method: "POST",
      body: JSON.stringify({ fileName, content }),
    });
  },
  approve: async (sessionId: string, approved: boolean) => {
    await agentFetch(`/api/agent/sessions/${sessionId}/approval`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    });
  },
  cancel: async (sessionId: string) => {
    await agentFetch(`/api/agent/sessions/${sessionId}/cancel`, { method: "POST", body: "{}" });
  },
  sendMessage: async (
    sessionId: string,
    message: string,
    answers: ClosedAnswer[],
    onEvent: (event: AgentEvent) => void,
    signal?: AbortSignal,
  ) => {
    const response = await agentFetch(`/api/agent/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, answers }),
      signal,
    });
    if (!response.body) throw new Error("Agent akışı açılamadı.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const lines = frame.split(/\r?\n/);
        const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        if (!isAgentEventType(eventName)) continue;
        const data = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data) continue;
        const parsed = JSON.parse(data) as Record<string, unknown>;
        if (parsed.type !== eventName) continue;
        onEvent(parsed as AgentEvent);
      }
      if (done) break;
    }
  },
} as const;

const agentEventTypes = new Set<AgentEvent["type"]>([
  "text_delta",
  "tool_call",
  "input_required",
  "approval_required",
  "completed",
  "cancelled",
  "error",
]);

function isAgentEventType(value: string | undefined): value is AgentEvent["type"] {
  return value !== undefined && agentEventTypes.has(value as AgentEvent["type"]);
}
