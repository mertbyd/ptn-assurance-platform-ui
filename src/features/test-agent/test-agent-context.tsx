"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import {
  AgentHttpError,
  agentApi,
  type AgentEvent,
  type AgentSessionDto,
  type ClosedAnswer,
  type ClosedQuestion,
  type StepProposal,
} from "@/api/agent";
import {
  testApi,
  type AddDatabaseAuthoringStepDto,
  type AuthoringSessionDto,
  type CreateAuthoringSessionDto,
} from "@/api/test";
import type {
  AgentConversationController,
  AgentConversationMessage,
  AgentState,
  AgentToolActivity,
} from "@/components/ui/floating-agent";
import { extractUserMessage } from "@/lib/error-messages";

type SessionStatus = "not_started" | "ready" | "running" | "input_required" | "approval_required" | "cancelled";

interface TestAgentContextValue {
  conversation: AgentConversationController;
  session: AgentSessionDto | null;
  sessionStatus: SessionStatus;
  ensureSession: () => Promise<AgentSessionDto>;
  uploadContext: (fileName: "senaryo.md" | "kurallar.md", content: string) => Promise<void>;
  authoringSession: AuthoringSessionDto | null;
  startAuthoringSession: (input: CreateAuthoringSessionDto) => Promise<AuthoringSessionDto>;
  answerAuthoringQuestion: (questionCode: string, selectedOption: string) => Promise<void>;
  addDatabaseAuthoringStep: (input: AddDatabaseAuthoringStepDto) => Promise<void>;
}

const TestAgentContext = createContext<TestAgentContextValue | null>(null);

function nextMessage(messages: AgentConversationMessage[], role: AgentConversationMessage["role"], text: string): AgentConversationMessage[] {
  return [...messages, { id: crypto.randomUUID(), role, text }];
}

/* Çalışan araçları bitmiş sayar. Değişecek bir şey yoksa AYNI dizi referansı döner; React
 * o zaman render'ı atlar ve her `text_delta` için gereksiz güncelleme yapılmaz. */
function settleTools(items: AgentToolActivity[]): AgentToolActivity[] {
  if (!items.some((item) => item.status === "running")) return items;
  return items.map((item) => (item.status === "running" ? { ...item, status: "done" as const } : item));
}

/* Ajan yüzeyinin hata kodları `Result<T>` zarfı taşımaz; kapalı bir kod kümesidir. Sunucudaki
 * yakalayıcı tanımadığı HER hatayı `agent_state_conflict`e düşürdüğü için (create-server.ts),
 * 409 hem "yanlış durumda mesaj" hem "eksik/geçersiz cevap kümesi" demektir. Metin ikisini de
 * karşılar ve teknik ayrıntı vaat etmez (ADR-0023 §F). */
function agentErrorMessage(code: string): string {
  if (code === "session_forbidden") return "Bu agent oturumu başka bir kullanıcıya ait. Yeni oturum başlatın.";
  if (code === "agent_state_conflict") return "Ajan bu durumda istek kabul etmiyor ya da kapalı cevap kümesi eksik. Bekleyen soruların hepsini seçip tekrar deneyin.";
  if (code === "invalid_request") return "İstek biçimi kabul edilmedi. Seçimlerinizi kontrol edip tekrar deneyin.";
  if (code === "budget_exceeded") return "Tur/token bütçesi doldu. Oturum hazır durumda; yeni bir mesajla devam edebilirsiniz.";
  return "Agent yanıt veremedi.";
}

export function TestAgentProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<AgentSessionDto | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("not_started");
  const [messages, setMessages] = useState<AgentConversationMessage[]>([]);
  const [questions, setQuestions] = useState<ClosedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proposal, setProposal] = useState<StepProposal | null>(null);
  const [activeTools, setActiveTools] = useState<AgentToolActivity[]>([]);
  const [usage, setUsage] = useState({ turns: 0, tokens: 0 });
  const [error, setError] = useState<string | null>(null);
  const [authoringSession, setAuthoringSession] = useState<AuthoringSessionDto | null>(null);
  const [authoringExpiresAt, setAuthoringExpiresAt] = useState<number | null>(null);
  const sessionPromise = useRef<Promise<AgentSessionDto> | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const requestInFlight = useRef(false);
  const approvalInFlight = useRef(false);
  const cancellationRequested = useRef(false);

  const ensureSession = useCallback(async (): Promise<AgentSessionDto> => {
    if (session && sessionStatus !== "cancelled") return session;
    if (sessionPromise.current) return sessionPromise.current;

    cancellationRequested.current = false;
    const request = agentApi.startSession("Grounding")
      .then((created) => {
        setSession(created);
        setSessionStatus("ready");
        setMessages((items) => nextMessage(items, "system", `Grounding hazır · ${created.allowedToolCodes.length} güvenli araç · ${created.maxTurns} tur bütçesi`));
        setError(null);
        return created;
      })
      .finally(() => {
        sessionPromise.current = null;
      });
    sessionPromise.current = request;
    return request;
  }, [session, sessionStatus]);

  const consumeEvent = useCallback((event: AgentEvent) => {
    /* Sıradan türetme: `tool_call` dışındaki her olay, önceki aracın bittiğini kanıtlar. */
    if (event.type !== "tool_call") setActiveTools(settleTools);

    if (event.type === "text_delta") {
      setMessages((items) => {
        const last = items.at(-1);
        if (last?.role === "agent" && last.streaming) {
          return [...items.slice(0, -1), { ...last, text: last.text + event.delta }];
        }
        return [...items, { id: crypto.randomUUID(), role: "agent", text: event.delta, streaming: true }];
      });
      return;
    }
    if (event.type === "tool_call") {
      /* Araç çalışması mesaj balonu DEĞİLDİR: süreç, çıktının görsel ağırlığına
       * çıkarılmaz; soluk aktivite satırında gösterilir. Aynı ad ardışık gelirse
       * satır titremesin diye tekrar eklenmez. */
      setActiveTools((items) => {
        const last = items.at(-1);
        if (last?.name === event.name && last.status === "running") return items;
        return [...settleTools(items), { name: event.name, status: "running" }];
      });
      setMessages((items) => items.map((item) => ({ ...item, streaming: false })));
      return;
    }
    if (event.type === "input_required") {
      setQuestions(event.questions);
      setAnswers({});
      setSessionStatus("input_required");
      setMessages((items) => items.map((item) => ({ ...item, streaming: false })));
      return;
    }
    if (event.type === "approval_required") {
      setProposal(event.proposal);
      setSessionStatus("approval_required");
      setMessages((items) => items.map((item) => ({ ...item, streaming: false })));
      return;
    }
    if (event.type === "completed") {
      setUsage({ turns: event.turns, tokens: event.tokens });
      setSessionStatus("ready");
      setMessages((items) => items.map((item) => ({ ...item, streaming: false })));
      return;
    }
    if (event.type === "cancelled") {
      setSessionStatus("cancelled");
      setMessages((items) => nextMessage(items.map((item) => ({ ...item, streaming: false })), "system", "Agent oturumu iptal edildi."));
      return;
    }
    /* `error` oturumu ÖLDÜRMEZ: sunucu her iki hata kodunda da durumu `ready`'ye çeker.
     * Bütçe hatası bu yüzden "oturum bitti" gibi gösterilmez. Sunucunun kendi metni
     * kasıtlı jeneriktir; kullanıcıya kod bazlı kendi metnimizi yazarız (G-12). */
    setSessionStatus("ready");
    setError(agentErrorMessage(event.code));
    setMessages((items) => items.map((item) => ({ ...item, streaming: false })));
  }, []);

  const send = useCallback(async (text: string, closedAnswers: ClosedAnswer[] = []) => {
    const trimmed = text.trim();
    if (!trimmed || requestInFlight.current || sessionStatus === "running" || sessionStatus === "approval_required" || sessionStatus === "cancelled") return;

    requestInFlight.current = true;
    setError(null);
    setActiveTools([]);
    setSessionStatus("running");
    setMessages((items) => nextMessage(items, "user", trimmed));
    try {
      const active = await ensureSession();
      if (cancellationRequested.current) return;
      setQuestions([]);
      setAnswers({});
      const controller = new AbortController();
      activeRequest.current = controller;
      await agentApi.sendMessage(active.id, trimmed, closedAnswers, consumeEvent, controller.signal);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestError instanceof AgentHttpError && requestError.code === "session_not_found") {
        setSession(null);
        setSessionStatus("not_started");
        setError("Agent oturumu sunucudan düştü. Taslağınız korundu; yeniden gönderdiğinizde yeni oturum açılacak.");
        return;
      }
      /* Oturum sahipliği sunucuda `ownerId` ile korunuyor; başkasının oturumuna dokunmak
       * `403 session_forbidden` verir. Bu, düşen oturumdan farklı bir durumdur. */
      if (requestError instanceof AgentHttpError && requestError.code === "session_forbidden") {
        setSession(null);
        setSessionStatus("not_started");
        setError(agentErrorMessage(requestError.code));
        return;
      }
      setSessionStatus("ready");
      setError(requestError instanceof AgentHttpError
        ? agentErrorMessage(requestError.code)
        : extractUserMessage(requestError, "Agent yanıt veremedi."));
    } finally {
      activeRequest.current = null;
      requestInFlight.current = false;
    }
  }, [consumeEvent, ensureSession, sessionStatus]);

  const continueWithAnswers = useCallback(async () => {
    const closedAnswers = questions.map<ClosedAnswer>((question) => ({
      questionCode: question.questionCode,
      selectedOption: answers[question.questionCode] ?? "",
    }));
    if (closedAnswers.some((answer) => !answer.selectedOption)) return;
    await send("Seçilen kapalı yanıtlarla devam et.", closedAnswers);
  }, [answers, questions, send]);

  const decideProposal = useCallback(async (approved: boolean) => {
    if (!session || !proposal || approvalInFlight.current || sessionStatus !== "approval_required") return;
    approvalInFlight.current = true;
    setError(null);
    try {
      if (approved && !authoringSession) {
        setError("Öneriyi kaydetmek için önce Test Module yazarlık oturumunu başlatın.");
        return;
      }
      if (approved && authoringSession) {
        const updated = await testApi.authoring.addStep(authoringSession.id, {
          stepId: proposal.stepId,
          operationReferenceId: proposal.operationReferenceId,
          requestBodyJson: proposal.requestBodyJson,
          assertionPaths: proposal.assertionPaths,
        });
        setAuthoringSession(updated);
        setAuthoringExpiresAt(Date.now() + updated.ttlMs);
      }
      await agentApi.approve(session.id, approved);
      setMessages((items) => nextMessage(items, "system", approved
        ? `Adım onaylandı ve Arazzo oturumuna kaydedildi: ${proposal.stepId}.`
        : `Adım reddedildi: ${proposal.stepId}. Bu agent oturumu kapatıldı.`));
      setProposal(null);
      setSessionStatus(approved ? "ready" : "cancelled");
    } catch (requestError) {
      setError(extractUserMessage(requestError, "Adım kararı kaydedilemedi."));
    } finally {
      approvalInFlight.current = false;
    }
  }, [authoringSession, proposal, session, sessionStatus]);

  const cancel = useCallback(async () => {
    if (sessionStatus === "cancelled") return;
    cancellationRequested.current = true;
    activeRequest.current?.abort();
    try {
      const active = session ?? await sessionPromise.current;
      if (active) await agentApi.cancel(active.id);
    } finally {
      setSessionStatus("cancelled");
      setProposal(null);
      setQuestions([]);
      setMessages((items) => nextMessage(items, "system", "Agent oturumu kullanıcı tarafından kapatıldı."));
    }
  }, [session, sessionStatus]);

  const restart = useCallback(() => {
    activeRequest.current?.abort();
    cancellationRequested.current = false;
    setSession(null);
    setSessionStatus("not_started");
    setQuestions([]);
    setAnswers({});
    setProposal(null);
    setActiveTools([]);
    setUsage({ turns: 0, tokens: 0 });
    setError(null);
    setMessages((items) => nextMessage(items, "system", "Yeni agent oturumu bir sonraki mesajda açılacak."));
  }, []);

  const uploadContext = useCallback(async (fileName: "senaryo.md" | "kurallar.md", content: string) => {
    const active = await ensureSession();
    await agentApi.upload(active.id, fileName, content);
    setMessages((items) => nextMessage(items, "system", `${fileName} agent bağlamına yüklendi.`));
  }, [ensureSession]);

  const startAuthoringSession = useCallback(async (input: CreateAuthoringSessionDto) => {
    setError(null);
    const created = await testApi.authoring.createSession(input);
    setAuthoringSession(created);
    setAuthoringExpiresAt(Date.now() + created.ttlMs);
    setMessages((items) => nextMessage(items, "system", `Test Module yazarlık oturumu açıldı · ${created.workflowId} · TTL ${Math.ceil(created.ttlMs / 60000)} dk`));
    return created;
  }, []);

  const answerAuthoringQuestion = useCallback(async (questionCode: string, selectedOption: string) => {
    if (!authoringSession) throw new Error("Yazarlık oturumu bulunamadı.");
    const updated = await testApi.authoring.answer(authoringSession.id, questionCode, selectedOption);
    setAuthoringSession(updated);
    setAuthoringExpiresAt(Date.now() + updated.ttlMs);
    setMessages((items) => nextMessage(items, "system", `Kapalı yazarlık yanıtı kaydedildi: ${questionCode} = ${selectedOption}`));
  }, [authoringSession]);

  const addDatabaseAuthoringStep = useCallback(async (input: AddDatabaseAuthoringStepDto) => {
    if (!authoringSession) throw new Error("Yazarlık oturumu bulunamadı.");
    const updated = await testApi.authoring.addDatabaseStep(authoringSession.id, input);
    setAuthoringSession(updated);
    setAuthoringExpiresAt(Date.now() + updated.ttlMs);
    setMessages((items) => nextMessage(items, "system", `Veritabanı adımı Arazzo oturumuna kaydedildi: ${input.stepId}`));
  }, [authoringSession]);

  const state: AgentState = sessionStatus === "running"
    ? (activeTools.length > 0 ? "working" : "thinking")
    : "idle";

  const conversation = useMemo<AgentConversationController>(() => ({
    state,
    status: sessionStatus,
    messages,
    questions,
    answers,
    proposal,
    activeTools,
    usage: session ? { ...usage, maxTurns: session.maxTurns, tokenLimit: session.tokenLimit } : null,
    authoringExpiresAt,
    error,
    canSend: sessionStatus === "not_started" || sessionStatus === "ready",
    onSend: send,
    onSelectAnswer: (questionCode, selectedOption) => setAnswers((items) => ({ ...items, [questionCode]: selectedOption })),
    onContinueAnswers: continueWithAnswers,
    onApprove: decideProposal,
    onCancel: cancel,
    onRestart: restart,
  }), [activeTools, answers, authoringExpiresAt, cancel, continueWithAnswers, decideProposal, error, messages, proposal, questions, restart, send, session, sessionStatus, state, usage]);

  const value = useMemo<TestAgentContextValue>(() => ({
    conversation,
    session,
    sessionStatus,
    ensureSession,
    uploadContext,
    authoringSession,
    startAuthoringSession,
    answerAuthoringQuestion,
    addDatabaseAuthoringStep,
  }), [addDatabaseAuthoringStep, answerAuthoringQuestion, authoringSession, conversation, ensureSession, session, sessionStatus, startAuthoringSession, uploadContext]);
  return <TestAgentContext.Provider value={value}>{children}</TestAgentContext.Provider>;
}

export function useTestAgent(): TestAgentContextValue {
  const value = useContext(TestAgentContext);
  if (!value) throw new Error("useTestAgent must be used inside TestAgentProvider.");
  return value;
}
