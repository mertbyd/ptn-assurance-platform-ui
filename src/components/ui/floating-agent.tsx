"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type AgentState = "idle" | "thinking" | "working";

export interface AgentConversationMessage {
  id: string | number;
  role: "user" | "agent" | "system";
  text: string;
  streaming?: boolean;
}

export interface AgentConversationQuestion {
  questionCode: string;
  prompt: string;
  options: string[];
  gapKindCode?: string;
}

export interface AgentConversationProposal {
  stepId: string;
  operationReferenceId: string;
  requestBodyJson?: string | null;
  assertionPaths: string[];
}

export interface AgentConversationController {
  state: AgentState;
  status: string;
  messages: AgentConversationMessage[];
  questions: AgentConversationQuestion[];
  answers: Record<string, string>;
  proposal: AgentConversationProposal | null;
  activeTools: string[];
  usage: { turns: number; tokens: number; maxTurns: number; tokenLimit: number } | null;
  authoringExpiresAt: number | null;
  error: string | null;
  canSend: boolean;
  onSend: (text: string) => Promise<void>;
  onSelectAnswer: (questionCode: string, selectedOption: string) => void;
  onContinueAnswers: () => Promise<void>;
  onApprove: (approved: boolean) => Promise<void>;
  onCancel: () => Promise<void>;
  onRestart: () => void;
}

export interface FloatingAgentProps {
  state?: AgentState;
  title?: string;
  onSend?: (text: string) => Promise<string>;
  conversation?: AgentConversationController;
}

const AMBER = "#f5a623";
const DRAG_THRESHOLD = 5;
const DOCK_DURATION_MS = 560;

interface AgentOffset {
  x: number;
  y: number;
}

interface AgentDragSession {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffset: AgentOffset;
  dragged: boolean;
}

const FALLBACK_REPLIES = [
  "Senaryo kapsamını inceliyorum. Checker kanıtlarını sıraya alacağım.",
  "İş kurallarını test adımlarına dönüştürmek için hazırım.",
  "API ve veritabanı kanıtlarını birlikte değerlendirebilirim.",
];

function Laptop({ active }: { active: boolean }) {
  return (
    <svg aria-hidden className="ptn-agent-laptop" viewBox="0 0 76 52">
      <defs>
        <linearGradient id="ptn-agent-screen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#202736" />
          <stop offset="1" stopColor="#0b0e15" />
        </linearGradient>
      </defs>
      <rect fill="#2e3544" height="39" rx="5" width="62" x="7" y="2" />
      <rect fill="url(#ptn-agent-screen)" height="31" rx="3" width="54" x="11" y="6" />
      <circle cx="38" cy="40" fill="#7e8798" r="1.6" />
      {active && (
        <g className="ptn-agent-code-lines">
          <rect fill="#f5a623" height="2.5" rx="1.25" width="22" x="16" y="12" />
          <rect fill="#4ade80" height="2.5" rx="1.25" width="31" x="16" y="18" />
          <rect fill="#ffd080" height="2.5" rx="1.25" width="18" x="16" y="24" />
          <rect fill="#70809a" height="2.5" rx="1.25" width="27" x="16" y="30" />
        </g>
      )}
      <path d="M4 42h68l4 6c.7 1.1-.1 2-1.4 2H1.4C.1 50-.7 49 0 48l4-6Z" fill="#596274" />
      <path d="M30 44h16l2 3H28l2-3Z" fill="#303746" />
    </svg>
  );
}

function HappyMascot() {
  return (
    <Image
      alt=""
      aria-hidden
      className="ptn-agent-mascot"
      height={512}
      priority
      src="/agent/happy-astronaut.png"
      width={512}
    />
  );
}

function MessageBubble({ message }: { message: AgentConversationMessage }) {
  const isAgent = message.role === "agent";
  const appearance = message.role === "system" ? "is-system" : isAgent ? "is-agent" : "is-user";
  return <div className={`ptn-agent-message ${appearance}`}>{message.text}</div>;
}

function TypingDots() {
  return <span aria-label="Agent düşünüyor" className="ptn-agent-typing" role="status"><i /><i /><i /></span>;
}

export function FloatingAgent({ state: externalState, title = "PTN Agent", onSend, conversation }: FloatingAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalState, setInternalState] = useState<AgentState>("idle");
  const [messages, setMessages] = useState<AgentConversationMessage[]>([
    { id: 0, role: "agent", text: "Merhaba! Test akışlarını birlikte hazırlayabiliriz." },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [offset, setOffset] = useState<AgentOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDocking, setIsDocking] = useState(false);
  const messageId = useRef(1);
  const messageEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragSession = useRef<AgentDragSession | null>(null);
  const suppressClick = useRef(false);
  const dockTimer = useRef<number | null>(null);

  const authoringExpiresAt = conversation?.authoringExpiresAt;

  const agentState = conversation?.state ?? externalState ?? internalState;
  const displayMessages = conversation?.messages ?? messages;
  const isBusy = conversation ? conversation.status === "running" : isSending || agentState !== "idle";
  const showTyping = conversation ? conversation.status === "running" : isSending;
  const authoringRemainingMs = conversation?.authoringExpiresAt
    ? Math.max(0, conversation.authoringExpiresAt - clock)
    : null;
  const authoringRemainingMinutes = authoringRemainingMs === null ? null : Math.ceil(authoringRemainingMs / 60_000);
  const remainingTurns = conversation?.usage
    ? Math.max(0, conversation.usage.maxTurns - conversation.usage.turns)
    : null;
  const approvalWhy = [...displayMessages].reverse().find((message) => message.role === "agent")?.text
    ?? "Ajan, checker kanıtlarından tek bir yazarlık adımı önerdi.";

  /* TTL yokken zamanlayıcı durur ve `clock` bayatlar; yeni bir TTL geldiğinde geri sayımın
   * ilk saniyeyi yanlış göstermemesi için değer önce bir kez hemen tazelenir. Tazeleme
   * effect gövdesinde değil zamanlayıcı geri çağrısında yapılır: effect gövdesindeki senkron
   * setState zincirleme render üretir, `Date.now()` ise render sırasında impure'dur. */
  useEffect(() => {
    if (!authoringExpiresAt) return;
    const prime = window.setTimeout(() => setClock(Date.now()), 0);
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => {
      window.clearTimeout(prime);
      window.clearInterval(timer);
    };
  }, [authoringExpiresAt]);

  useEffect(() => {
    if (!isOpen) return;
    messageEnd.current?.scrollIntoView({ behavior: "smooth" });
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 160);
    return () => clearTimeout(focusTimer);
  }, [displayMessages, isOpen, showTyping]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    const keepInsideViewport = () => setOffset((current) => clampAgentOffset(current));
    window.addEventListener("resize", keepInsideViewport);
    return () => window.removeEventListener("resize", keepInsideViewport);
  }, []);

  useEffect(() => () => {
    if (dockTimer.current !== null) window.clearTimeout(dockTimer.current);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (dockTimer.current !== null) window.clearTimeout(dockTimer.current);
    setIsDocking(false);
    dragSession.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffset: offset,
      dragged: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const session = dragSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - session.startClientX;
    const deltaY = event.clientY - session.startClientY;
    if (!session.dragged && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
    if (!session.dragged) {
      session.dragged = true;
      setIsDragging(true);
      setIsOpen(false);
    }
    setOffset(clampAgentOffset({
      x: session.startOffset.x + deltaX,
      y: session.startOffset.y - deltaY,
    }));
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const session = dragSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClick.current = session.dragged;
    dragSession.current = null;
    setIsDragging(false);
    if (suppressClick.current) window.setTimeout(() => { suppressClick.current = false; }, 0);
  }

  function activateAgent() {
    if (suppressClick.current) return;
    const isAwayFromDock = offset.x > 1 || offset.y > 1;
    if (!isAwayFromDock) {
      setIsOpen(true);
      return;
    }
    setIsOpen(false);
    setIsDocking(true);
    setOffset({ x: 0, y: 0 });
    dockTimer.current = window.setTimeout(() => {
      setIsDocking(false);
      setIsOpen(true);
      dockTimer.current = null;
    }, DOCK_DURATION_MS);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isBusy || (conversation && !conversation.canSend)) return;
    setInput("");
    if (conversation) {
      await conversation.onSend(text);
      return;
    }
    setMessages((items) => [...items, { id: messageId.current++, role: "user", text }]);
    setIsSending(true);
    setInternalState("thinking");
    try {
      const reply = onSend
        ? await onSend(text)
        : await new Promise<string>((resolve) => {
            setTimeout(() => resolve(FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]), 850);
          });
      setInternalState("working");
      setMessages((items) => [...items, { id: messageId.current++, role: "agent", text: reply }]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Agent yanıt veremedi.";
      setMessages((items) => [...items, { id: messageId.current++, role: "agent", text }]);
    } finally {
      setIsSending(false);
      setInternalState("idle");
    }
  }

  const statusText = conversation?.status === "input_required"
    ? "Yanıt bekliyor"
    : conversation?.status === "approval_required"
      ? "Onay bekliyor"
      : conversation?.status === "cancelled"
        ? "Oturum kapalı"
        : agentState === "thinking"
          ? "Düşünüyor"
          : agentState === "working"
            ? "Çalışıyor"
            : "Hazır";
  const allQuestionsAnswered = conversation?.questions.every((question) => Boolean(conversation.answers[question.questionCode])) ?? false;
  const isDocked = offset.x <= 1 && offset.y <= 1;

  return (
    <div
      className={`ptn-floating-agent ${isDragging ? "is-dragging" : ""} ${isDocking ? "is-docking" : ""}`}
      data-agent-state={agentState}
      style={{ transform: `translate3d(${offset.x}px, ${-offset.y}px, 0)` }}
    >
      {isOpen && (
        <section aria-label={`${title} sohbeti`} className="ptn-agent-panel" role="dialog">
          <header className="ptn-agent-header">
            <span className="ptn-agent-face" aria-hidden>⌁</span>
            <div><strong>{title}</strong><span><i className="ptn-agent-status-dot" />{statusText}</span></div>
            {conversation && conversation.status !== "not_started" && conversation.status !== "cancelled" && (
              <button aria-label="Agent oturumunu iptal et" className="ptn-agent-cancel" onClick={() => void conversation.onCancel()} title="Oturumu iptal et" type="button">■</button>
            )}
            <button aria-label="Sohbeti kapat" className="ptn-agent-close" onClick={() => setIsOpen(false)} type="button">×</button>
          </header>
          <div aria-live="polite" className="ptn-agent-messages">
            {conversation?.usage && (
              <div className={`ptn-agent-budget ${remainingTurns !== null && remainingTurns <= 2 ? "is-warning" : ""}`}>
                <span>{conversation.usage.turns}/{conversation.usage.maxTurns} tur · {remainingTurns} kaldı</span>
                <span>{conversation.usage.tokens.toLocaleString("tr-TR")}/{conversation.usage.tokenLimit.toLocaleString("tr-TR")} token</span>
              </div>
            )}
            {authoringRemainingMinutes !== null && (
              <div className={`ptn-agent-ttl ${authoringRemainingMinutes <= 5 ? "is-warning" : ""}`}>
                Yazarlık taslağı: {authoringRemainingMinutes > 0 ? `${authoringRemainingMinutes} dk kaldı` : "süre doldu — kalıcılaştırın"}
              </div>
            )}
            {conversation?.activeTools.length ? <div className="ptn-agent-tools">{conversation.activeTools.map((tool) => <span key={tool}>{tool}</span>)}</div> : null}
            {displayMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {showTyping && <div className="ptn-agent-message is-agent"><TypingDots /></div>}
            {conversation?.questions.map((question) => (
              <div className="ptn-agent-interrupt" key={question.questionCode}>
                <strong>{question.prompt}</strong>
                {question.gapKindCode && <small>{question.gapKindCode}</small>}
                <div>{question.options.map((option) => (
                  <button
                    className={conversation.answers[question.questionCode] === option ? "is-selected" : ""}
                    key={option}
                    onClick={() => conversation.onSelectAnswer(question.questionCode, option)}
                    type="button"
                  >{option}</button>
                ))}</div>
              </div>
            ))}
            {conversation?.questions.length ? (
              <button className="ptn-agent-continue" disabled={!allQuestionsAnswered} onClick={() => void conversation.onContinueAnswers()} type="button">Seçimlerle devam et</button>
            ) : null}
            {conversation?.proposal && (
              <div className="ptn-agent-approval">
                <strong>İnsan onayı gerekiyor</strong>
                <dl>
                  <div><dt>Ne yapılacak?</dt><dd><b>{conversation.proposal.stepId}</b> adımı opak operasyon referansına bağlanacak.<code>{conversation.proposal.operationReferenceId}</code></dd></div>
                  <div><dt>Neden?</dt><dd>{approvalWhy}{conversation.activeTools.length ? ` Kanıt araçları: ${conversation.activeTools.join(", ")}.` : ""}</dd></div>
                  <div><dt>Ne değişecek?</dt><dd>{conversation.proposal.assertionPaths.length} türetilebilir assertion Test Module yazarlık belgesine eklenecek.{conversation.proposal.requestBodyJson ? " İstek gövdesi taslağı da kaydedilecek." : ""}</dd></div>
                  <div><dt>Nasıl geri alınır?</dt><dd>Reddederseniz adım eklenmez ve bu agent oturumu kalıcı olarak kapanır. Taslak, Test Module TTL süresi içinde atılabilir.</dd></div>
                </dl>
                <div>
                  <button onClick={() => void conversation.onApprove(true)} type="button">Adımı onayla</button>
                  <button className="is-reject" onClick={() => void conversation.onApprove(false)} type="button">Reddet ve oturumu kapat</button>
                </div>
              </div>
            )}
            {conversation?.error && <div className="ptn-agent-error">{conversation.error}</div>}
            {conversation?.status === "cancelled" && (
              <button className="ptn-agent-restart" onClick={conversation.onRestart} type="button">Yeni agent oturumu başlat</button>
            )}
            <div ref={messageEnd} />
          </div>
          {!conversation?.questions.length && !conversation?.proposal && conversation?.status !== "cancelled" && <div className="ptn-agent-composer">
            <input
              aria-label="Agent mesajı"
              disabled={isBusy || (conversation ? !conversation.canSend : false)}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Bir şeyler sor…"
              ref={inputRef}
              value={input}
            />
            <button aria-label="Gönder" disabled={!input.trim() || isBusy || (conversation ? !conversation.canSend : false)} onClick={() => void handleSend()} type="button">↑</button>
          </div>}
        </section>
      )}
      <button
        aria-expanded={isOpen}
        aria-label={isDocked ? "Agent sohbetini aç" : "Agentı köşesine götür ve sohbeti aç"}
        className="ptn-agent-pet"
        onClick={activateAgent}
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        type="button"
      >
        <span className="ptn-agent-pet-visual"><HappyMascot />{(isBusy || isOpen) && <Laptop active={isBusy} />}</span>
        <span className="ptn-agent-pet-label"><i />{statusText}</span>
      </button>

      <style>{`
        .ptn-floating-agent { --agent-edge: max(18px, env(safe-area-inset-left)); position: fixed; inset: auto auto max(14px, env(safe-area-inset-bottom)) var(--agent-edge); z-index: 9100; width: 102px; height: 118px; pointer-events: none; isolation: isolate; will-change: transform; }
        .ptn-floating-agent.is-docking { transition: transform ${DOCK_DURATION_MS}ms cubic-bezier(.22,.9,.22,1); }
        .ptn-agent-pet { all: unset; position: absolute; inset: auto auto 0 0; width: 102px; height: 118px; cursor: grab; pointer-events: auto; user-select: none; touch-action: none; filter: drop-shadow(0 8px 15px rgba(0,0,0,.42)); transition: filter 180ms ease, transform 180ms ease; }
        .ptn-floating-agent.is-dragging .ptn-agent-pet { cursor: grabbing; filter: drop-shadow(0 13px 22px rgba(0,0,0,.5)); transform: scale(1.04); }
        .ptn-floating-agent.is-docking .ptn-agent-mascot { animation: ptn-agent-run 180ms ease-in-out infinite alternate; }
        .ptn-agent-pet:hover { filter: drop-shadow(0 9px 20px rgba(245,166,35,.35)); transform: translateY(-2px); }
        .ptn-agent-pet:focus-visible { outline: 2px solid ${AMBER}; outline-offset: 4px; border-radius: 18px; }
        .ptn-agent-pet-visual { position: absolute; inset: 0; display: block; }
        .ptn-agent-mascot { position: absolute; left: 1px; bottom: 17px; width: 86px; height: 86px; object-fit: contain; animation: ptn-agent-breathe 3s ease-in-out infinite; }
        .ptn-agent-laptop { position: absolute; z-index: 2; left: 42px; bottom: 20px; width: 62px; height: auto; animation: ptn-agent-laptop-in 220ms cubic-bezier(.16,1,.3,1) both; }
        .ptn-agent-code-lines rect { transform-origin: left center; animation: ptn-agent-code 1.2s ease-in-out infinite alternate; }
        .ptn-agent-code-lines rect:nth-child(2) { animation-delay: 120ms; } .ptn-agent-code-lines rect:nth-child(3) { animation-delay: 240ms; } .ptn-agent-code-lines rect:nth-child(4) { animation-delay: 360ms; }
        .ptn-agent-antenna-active { animation: ptn-agent-antenna 850ms ease-in-out infinite alternate; }
        .ptn-agent-pet-label { position: absolute; left: 3px; bottom: 0; display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border: 1px solid rgba(245,166,35,.28); border-radius: 999px; background: rgba(15,17,24,.92); color: rgba(255,248,232,.76); font: 650 10px/1.2 inherit; white-space: nowrap; box-shadow: 0 5px 16px rgba(0,0,0,.34); }
        .ptn-agent-pet-label i, .ptn-agent-status-dot { width: 6px; height: 6px; border-radius: 50%; background: ${AMBER}; box-shadow: 0 0 8px rgba(245,166,35,.7); }
        .ptn-floating-agent[data-agent-state="idle"] .ptn-agent-pet-label i, .ptn-floating-agent[data-agent-state="idle"] .ptn-agent-status-dot { background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,.7); }
        /* Sohbet paneli petin sağ-üstünde açılır ve viewport'un içinde kalır.
           Genişlik/yükseklik kasıtlı olarak büyüktür: onay kartı dört alanı
           (ne / neden / ne değişecek / nasıl geri alınır) kırpılmadan göstermek
           zorundadır — CURRENT-0007 G-03. */
        .ptn-agent-panel { position: absolute; left: 106px; bottom: 104px; width: min(620px, calc(100vw - 140px)); height: min(720px, calc(100dvh - 140px)); min-height: 420px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(245,166,35,.28); border-radius: 18px; background: rgba(17,19,27,.98); box-shadow: 0 28px 84px rgba(0,0,0,.6), inset 0 1px rgba(255,255,255,.04); pointer-events: auto; animation: ptn-agent-panel-in 220ms cubic-bezier(.16,1,.3,1) both; transform-origin: left bottom; }
        .ptn-agent-header { display: flex; align-items: center; gap: 10px; min-height: 58px; padding: 10px 12px; border-bottom: 1px solid rgba(245,166,35,.13); background: linear-gradient(110deg, rgba(245,166,35,.11), rgba(245,166,35,.025)); }
        .ptn-agent-face { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto; border-radius: 11px; background: ${AMBER}; color: #161922; font-size: 23px; font-weight: 900; }
        .ptn-agent-header > div { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; } .ptn-agent-header strong { color: #f7e2b5; font-size: 13px; letter-spacing: -.01em; }
        .ptn-agent-header span:not(.ptn-agent-face) { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,.42); font-size: 10.5px; }
        .ptn-agent-close, .ptn-agent-cancel { all: unset; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; color: rgba(255,255,255,.42); cursor: pointer; }
        .ptn-agent-close { font-size: 20px; } .ptn-agent-cancel { color: #f6b94c; font-size: 9px; }
        .ptn-agent-close:hover, .ptn-agent-cancel:hover { background: rgba(255,255,255,.07); color: #fff; }
        .ptn-agent-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 20px; scrollbar-width: thin; scrollbar-color: rgba(245,166,35,.25) transparent; }
        .ptn-agent-message { width: fit-content; max-width: 78%; margin-bottom: 10px; padding: 10px 13px; border: 1px solid rgba(255,255,255,.075); border-radius: 12px 12px 12px 3px; background: rgba(255,255,255,.04); color: rgba(255,255,255,.82); font-size: 13.5px; line-height: 1.58; white-space: pre-wrap; overflow-wrap: anywhere; animation: ptn-agent-message-in 170ms ease-out both; }
        .ptn-agent-message.is-user { margin-left: auto; border-color: rgba(245,166,35,.22); border-radius: 12px 12px 3px 12px; background: rgba(245,166,35,.11); color: #f8e5bc; }
        .ptn-agent-message.is-system { width: 100%; max-width: none; padding: 6px 8px; border-style: dashed; border-radius: 8px; color: rgba(255,255,255,.4); font-size: 10.5px; }
        .ptn-agent-budget { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 9px; color: rgba(255,255,255,.34); font-size: 9.5px; }
        .ptn-agent-budget.is-warning { color: #fbbf24; }
        .ptn-agent-ttl { margin: -2px 0 9px; padding: 5px 7px; border: 1px solid rgba(245,166,35,.16); border-radius: 7px; background: rgba(245,166,35,.055); color: rgba(255,255,255,.46); font-size: 9.5px; }
        .ptn-agent-ttl.is-warning { border-color: rgba(251,191,36,.35); color: #fbbf24; }
        .ptn-agent-tools { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 9px; }
        .ptn-agent-tools span { padding: 3px 7px; border: 1px solid rgba(245,166,35,.22); border-radius: 999px; background: rgba(245,166,35,.08); color: #e9c77f; font: 600 9px/1.2 ui-monospace, monospace; }
        .ptn-agent-interrupt, .ptn-agent-approval { margin: 10px 0; padding: 11px; border: 1px solid rgba(245,166,35,.28); border-radius: 10px; background: rgba(245,166,35,.07); }
        .ptn-agent-interrupt strong, .ptn-agent-approval strong { display: block; color: #f5d28b; font-size: 11.5px; line-height: 1.45; }
        .ptn-agent-interrupt small, .ptn-agent-approval small { display: block; margin-top: 4px; color: rgba(255,255,255,.36); font-size: 9.5px; }
        .ptn-agent-interrupt > div, .ptn-agent-approval > div { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .ptn-agent-interrupt button, .ptn-agent-approval button, .ptn-agent-continue { border: 1px solid rgba(245,166,35,.28); border-radius: 7px; background: rgba(255,255,255,.045); color: rgba(255,255,255,.7); padding: 6px 8px; cursor: pointer; font: 600 10px/1.25 inherit; }
        .ptn-agent-interrupt button.is-selected, .ptn-agent-approval button:first-child, .ptn-agent-continue { border-color: rgba(245,166,35,.7); background: ${AMBER}; color: #151821; }
        .ptn-agent-continue { width: 100%; margin: 0 0 8px; }
        .ptn-agent-continue:disabled { cursor: not-allowed; opacity: .35; }
        .ptn-agent-approval dl { display: grid; gap: 8px; margin: 9px 0 0; }
        .ptn-agent-approval dl > div { display: block; margin: 0; }
        .ptn-agent-approval dt { color: #e9c77f; font-size: 9.5px; font-weight: 700; }
        .ptn-agent-approval dd { margin: 2px 0 0; color: rgba(255,255,255,.55); font-size: 10px; line-height: 1.45; }
        .ptn-agent-approval code { display: block; overflow: hidden; margin-top: 4px; color: rgba(255,255,255,.36); font-size: 8.5px; text-overflow: ellipsis; }
        .ptn-agent-approval button.is-reject { border-color: rgba(248,113,113,.24); background: rgba(248,113,113,.08); color: #fca5a5; }
        .ptn-agent-error { margin: 8px 0; padding: 8px 10px; border: 1px solid rgba(248,113,113,.25); border-radius: 8px; background: rgba(248,113,113,.07); color: #fca5a5; font-size: 10.5px; line-height: 1.4; }
        .ptn-agent-restart { width: 100%; margin: 8px 0; padding: 8px 10px; border: 1px solid rgba(245,166,35,.45); border-radius: 8px; background: rgba(245,166,35,.12); color: #f5d28b; cursor: pointer; font: 650 10.5px/1.3 inherit; }
        .ptn-agent-composer { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(245,166,35,.12); background: rgba(7,9,14,.5); }
        .ptn-agent-composer input { min-width: 0; height: 44px; flex: 1; padding: 0 14px; border: 1px solid rgba(255,255,255,.09); border-radius: 9px; outline: none; background: rgba(255,255,255,.045); color: #edf0f6; font: 13.5px inherit; }
        .ptn-agent-composer input:focus { border-color: rgba(245,166,35,.7); box-shadow: 0 0 0 3px rgba(245,166,35,.08); }
        .ptn-agent-composer button { all: unset; display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 auto; border-radius: 9px; background: ${AMBER}; color: #11141c; cursor: pointer; font-size: 18px; font-weight: 900; }
        .ptn-agent-composer button:disabled { cursor: not-allowed; opacity: .35; }
        .ptn-agent-typing { display: inline-flex; align-items: center; gap: 3px; min-height: 13px; } .ptn-agent-typing i { width: 5px; height: 5px; border-radius: 50%; background: ${AMBER}; animation: ptn-agent-dot 900ms ease-in-out infinite; }
        .ptn-agent-typing i:nth-child(2) { animation-delay: 130ms; } .ptn-agent-typing i:nth-child(3) { animation-delay: 260ms; }
        @keyframes ptn-agent-breathe { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-2px) scaleY(1.015); } }
        @keyframes ptn-agent-laptop-in { from { opacity: 0; transform: translateY(7px) scale(.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ptn-agent-code { from { opacity: .45; transform: scaleX(.72); } to { opacity: 1; transform: scaleX(1); } }
        @keyframes ptn-agent-antenna { from { filter: drop-shadow(0 0 2px #4ade80); } to { filter: drop-shadow(0 0 8px #4ade80); } }
        @keyframes ptn-agent-panel-in { from { opacity: 0; transform: translate(-8px,8px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes ptn-agent-message-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes ptn-agent-dot { 0%,100% { opacity: .35; transform: translateY(0); } 45% { opacity: 1; transform: translateY(-3px); } }
        @keyframes ptn-agent-run { from { transform: translateY(0) rotate(-2deg); } to { transform: translateY(-6px) rotate(3deg); } }
        @media (max-width: 640px) { .ptn-floating-agent { --agent-edge: 12px; bottom: 10px; } .ptn-agent-panel { position: fixed; left: 12px; right: 12px; bottom: 112px; width: auto; height: min(560px, calc(100dvh - 130px)); } }
        @media (prefers-reduced-motion: reduce) { .ptn-agent-mascot, .ptn-agent-laptop, .ptn-agent-code-lines rect, .ptn-agent-antenna-active, .ptn-agent-panel, .ptn-agent-message, .ptn-agent-typing i { animation: none !important; } }
      `}</style>
    </div>
  );
}

function clampAgentOffset(offset: AgentOffset): AgentOffset {
  if (typeof window === "undefined") return offset;
  const edge = window.innerWidth <= 640 ? 12 : 18;
  const bottom = window.innerWidth <= 640 ? 10 : 14;
  return {
    x: Math.max(0, Math.min(offset.x, window.innerWidth - edge - 102)),
    y: Math.max(0, Math.min(offset.y, window.innerHeight - bottom - 118)),
  };
}
