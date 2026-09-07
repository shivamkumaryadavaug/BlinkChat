import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getSocket, disconnectSocket } from "../socket/socket";
import { ChatMessage, RoomState, TemporaryIdentity } from "../types";
import MessageBubble from "./MessageBubble";
import ParticipantList from "./ParticipantList";
import CountdownTimer from "./CountdownTimer";
import TypingIndicator from "./TypingIndicator";

interface Props {
  roomCode: string;
  password?: string;
  onLeave: () => void;
  onExpired: () => void;
}


type RoomJoinResponse =
  | {
      ok: true;
      identity: TemporaryIdentity;
      sessionId?: string;
    }
  | {
      ok: false;
      error: string;
    };

export default function ChatRoom({ roomCode, password, onLeave, onExpired }: Props) {
  const [state, setState] = useState<RoomState | null>(null);
  const [identity, setIdentity] = useState<TemporaryIdentity | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const join = () => {
      const savedSessionId = sessionStorage.getItem(`blinkchat:session:${roomCode}`) ?? undefined;
      socket.emit("room:join", { roomCode, password, sessionId: savedSessionId }, (res: RoomJoinResponse) => {
        if (res.ok) {
          setIdentity(res.identity);
          setConnectionError(null);
          if (res.sessionId) sessionStorage.setItem(`blinkchat:session:${roomCode}`, res.sessionId);
        } else {
          setConnectionError(res.error);
        }
      });
    };

    // Re-join on every connect, including reconnects after mobile
    // background/lock or a dropped network — a bare `connect()` call only
    // fires this once, but the underlying socket can silently reconnect
    // with a new socket.id later, which otherwise orphans this client from
    // the server's Socket.IO room (it looks "connected" but stops
    // receiving/broadcasting messages).
    socket.on("connect", join);
    socket.connect();
    if (socket.connected) join();

    socket.on("room:state", (payload) => setState(payload));

    socket.on("message:new", (message) => {
      setState((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    });

    socket.on("reaction:update", ({ messageId, reactions }) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
            }
          : prev
      );
    });

    socket.on("participant:joined", ({ identity: newIdentity, participantCount }) => {
      setState((prev) => {
        if (!prev) return prev;
        const exists = prev.participants.some((p) => p.temporaryUserId === newIdentity.temporaryUserId);
        return {
          ...prev,
          participants: exists ? prev.participants : [...prev.participants, newIdentity],
        };
      });
      void participantCount;
    });

    socket.on("participant:left", ({ temporaryUserId }) => {
      setState((prev) =>
        prev
          ? { ...prev, participants: prev.participants.filter((p) => p.temporaryUserId !== temporaryUserId) }
          : prev
      );
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(temporaryUserId);
        return next;
      });
    });

    socket.on("typing:update", ({ temporaryUserId, displayName, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) next.set(temporaryUserId, displayName);
        else next.delete(temporaryUserId);
        return next;
      });
    });

    socket.on("room:expired", () => {
      onExpired();
    });

    socket.on("room:error", ({ error }) => {
      setConnectionError(error);
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socket.off("connect", join);
      socket.emit("room:leave", { roomCode });
      socket.removeAllListeners();
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, password]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.messages.length]);

  const messagesById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    state?.messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [state?.messages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const socket = getSocket();
    socket.emit("message:send", { roomCode, text, replyToId: replyTo?.id });
    socket.emit("typing:stop", { roomCode });
    setDraft("");
    setReplyTo(null);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const socket = getSocket();
    socket.emit("typing:start", { roomCode });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { roomCode });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleReact = (messageId: string, emoji: string) => {
    getSocket().emit("reaction:add", { roomCode, messageId, emoji });
  };

  const handleLeave = () => {
    onLeave();
  };

  if (connectionError) {
    return (
      <div className="room-error">
        <div className="glass room-error__card">
          <p className="room-error__title">Can't join this room</p>
          <p className="room-error__message">{connectionError}</p>
          <button className="btn btn--primary" onClick={onLeave} type="button">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!state || !identity) {
    return (
      <div className="room-loading">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Connecting to room…</p>
      </div>
    );
  }

  const typingNames = Array.from(typingUsers.entries())
    .filter(([id]) => id !== identity.temporaryUserId)
    .map(([, name]) => name);

  return (
    <div className="chat-room">
      <header className="chat-room__header glass">
        <div className="chat-room__header-main">
          <button className="icon-btn chat-room__menu" onClick={() => setSidebarOpen(true)} aria-label="Show participants">
            ☰
          </button>
          <div>
            <p className="chat-room__name">{state.roomName}</p>
            <p className="chat-room__code">{state.roomCode} · {state.participants.length} online</p>
          </div>
        </div>
        <div className="chat-room__header-actions">
          <CountdownTimer expiresAt={state.expiresAt} onExpire={onExpired} compact />
          <button className="btn btn--ghost btn--small" onClick={handleLeave} type="button">
            Leave
          </button>
        </div>
      </header>

      <div className="chat-room__body">
        <main className="chat-room__main">
          <div className="chat-room__messages">
            {state.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSelf={message.temporaryUserId === identity.temporaryUserId}
                repliedTo={message.replyToId ? messagesById.get(message.replyToId) : undefined}
                selfId={identity.temporaryUserId}
                onReply={setReplyTo}
                onReact={handleReact}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <TypingIndicator names={typingNames} />

          <form className="composer" onSubmit={handleSend}>
            {replyTo && (
              <div className="composer__reply">
                <span>
                  Replying to <strong>{replyTo.displayName}</strong>: {replyTo.text.slice(0, 60)}
                </span>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  ✕
                </button>
              </div>
            )}
            <div className="composer__row">
              <input
                className="composer__input"
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder="Say something…"
                maxLength={2000}
              />
              <button className="btn btn--primary composer__send" type="submit" disabled={!draft.trim()}>
                Send
              </button>
            </div>
          </form>
        </main>

        <aside className={`chat-room__sidebar ${sidebarOpen ? "chat-room__sidebar--open" : ""}`}>
          <button className="icon-btn chat-room__sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close">
            ✕
          </button>
          <ParticipantList participants={state.participants} selfId={identity.temporaryUserId} />
        </aside>
        {sidebarOpen && <div className="chat-room__scrim" onClick={() => setSidebarOpen(false)} />}
      </div>
    </div>
  );
}
