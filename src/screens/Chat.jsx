import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSocket, disconnectSocket } from "../lib/socket.js";
import { formatCountdown, formatTime, haptic, saveRecent } from "../lib/format.js";
import {
  BackIcon,
  IconButton,
  LeaveIcon,
  PeopleIcon,
  SendIcon,
  Sheet,
  XIcon,
} from "../components/ui.jsx";

const QUICK = ["❤️", "😂", "👍", "😮", "😢", "🎉"];

function Countdown({ expiresAt, onExpire, compact }) {
  const [left, setLeft] = useState(() => expiresAt - Date.now());
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  useEffect(() => {
    const id = setInterval(() => {
      const n = expiresAt - Date.now();
      setLeft(n);
      if (n <= 0) {
        clearInterval(id);
        expireRef.current?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt]);
  const urgent = left < 5 * 60 * 1000;
  return (
    <div className={`count ${urgent ? "is-urgent" : ""} ${compact ? "is-compact" : ""}`}>
      <span className="live-dot" />
      <b>{formatCountdown(left)}</b>
      {compact ? null : <small>until vanish</small>}
    </div>
  );
}

function Bubble({ message, self, replied, selfId, onReply, onReact }) {
  const reactions = Object.entries(message.reactions || {}).filter(([, ids]) => ids.length);
  return (
    <motion.article
      className={`msg ${self ? "is-self" : ""}`}
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    >
      {self ? null : (
        <span className="msg__avatar" style={{ background: `${message.color}22`, color: message.color }}>
          {message.emoji}
        </span>
      )}
      <div className="msg__col">
        {self ? null : (
          <p className="msg__who" style={{ color: message.color }}>
            {message.displayName}
          </p>
        )}
        {replied ? (
          <div className="msg__reply">
            <b>{replied.displayName}</b>
            <span>{replied.text.slice(0, 80)}</span>
          </div>
        ) : null}
        <div className="msg__bubble">
          <p>{message.text}</p>
          <time>{formatTime(message.createdAt)}</time>
        </div>
        {reactions.length ? (
          <div className="msg__rxn">
            {reactions.map(([emoji, ids]) => (
              <button
                key={emoji}
                className={`rxn ${selfId && ids.includes(selfId) ? "is-on" : ""}`}
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji} {ids.length}
              </button>
            ))}
          </div>
        ) : null}
        <div className="msg__ops">
          <button onClick={() => onReply(message)}>Reply</button>
          <span className="msg__quick">
            {QUICK.map((e) => (
              <button key={e} onClick={() => onReact(message.id, e)}>
                {e}
              </button>
            ))}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default function Chat({ roomCode, password, onLeave, onExpired }) {
  const [state, setState] = useState(null);
  const [me, setMe] = useState(null);
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [typing, setTyping] = useState(new Map());
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [error, setError] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [gone, setGone] = useState(false);
  const endRef = useRef(null);
  const typeTimer = useRef(null);
  const expiredOnce = useRef(false);

  const vanish = () => {
    if (expiredOnce.current) return;
    expiredOnce.current = true;
    setGone(true);
    setTimeout(() => onExpired(), 1700);
  };
  const byId = useMemo(() => {
    const m = new Map();
    state?.messages.forEach((x) => m.set(x.id, x));
    return m;
  }, [state?.messages]);

  useEffect(() => {
    const s = getSocket();

    const join = () => {
      const sessionId = sessionStorage.getItem(`blinkchat:session:${roomCode}`) || undefined;
      s.emit("room:join", { roomCode, password, sessionId }, (res) => {
        if (res?.ok) {
          setMe(res.identity);
          setError(null);
          if (res.sessionId) sessionStorage.setItem(`blinkchat:session:${roomCode}`, res.sessionId);
        } else setError(res?.error || "Can't join this room");
      });
    };

    const onState = (payload) => {
      setState(payload);
      saveRecent({ roomCode: payload.roomCode, roomName: payload.roomName });
    };
    const onMsg = (msg) => setState((cur) => (cur ? { ...cur, messages: [...cur.messages, msg] } : cur));
    const onRxn = ({ messageId, reactions }) =>
      setState((cur) =>
        cur
          ? {
              ...cur,
              messages: cur.messages.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
            }
          : cur
      );
    const onJoinP = ({ identity }) =>
      setState((cur) => {
        if (!cur) return cur;
        if (cur.participants.some((p) => p.temporaryUserId === identity.temporaryUserId)) return cur;
        return { ...cur, participants: [...cur.participants, identity] };
      });
    const onLeft = ({ temporaryUserId }) => {
      setState((cur) =>
        cur ? { ...cur, participants: cur.participants.filter((p) => p.temporaryUserId !== temporaryUserId) } : cur
      );
      setTyping((map) => {
        const n = new Map(map);
        n.delete(temporaryUserId);
        return n;
      });
    };
    const onType = ({ temporaryUserId, displayName, isTyping }) => {
      setTyping((map) => {
        const n = new Map(map);
        if (isTyping) n.set(temporaryUserId, displayName);
        else n.delete(temporaryUserId);
        return n;
      });
    };
    const expired = () => vanish();

    s.on("connect", join);
    s.on("room:state", onState);
    s.on("message:new", onMsg);
    s.on("reaction:update", onRxn);
    s.on("participant:joined", onJoinP);
    s.on("participant:left", onLeft);
    s.on("typing:update", onType);
    s.on("room:expired", expired);
    s.on("room:error", ({ error: e }) => setError(e));
    s.connect();
    if (s.connected) join();

    return () => {
      if (typeTimer.current) clearTimeout(typeTimer.current);
      s.emit("room:leave", { roomCode });
      s.off("connect", join);
      s.off("room:state", onState);
      s.off("message:new", onMsg);
      s.off("reaction:update", onRxn);
      s.off("participant:joined", onJoinP);
      s.off("participant:left", onLeft);
      s.off("typing:update", onType);
      s.off("room:expired", expired);
      disconnectSocket();
    };
  }, [roomCode, password, onExpired]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.messages.length, typing.size]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const s = getSocket();
    s.emit("message:send", { roomCode, text: t, replyToId: reply?.id });
    s.emit("typing:stop", { roomCode });
    setText("");
    setReply(null);
    haptic(8);
  };

  const onType = (value) => {
    setText(value);
    const s = getSocket();
    s.emit("typing:start", { roomCode });
    if (typeTimer.current) clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(() => {
      s.emit("typing:stop", { roomCode });
      typeTimer.current = null;
    }, 1800);
  };

  const react = (messageId, emoji) => {
    getSocket().emit("reaction:add", { roomCode, messageId, emoji });
    haptic(6);
  };

  if (error) {
    return (
      <div className="page center-page">
        <div className="empty-card">
          <p className="kicker">Can't join</p>
          <h2 className="display">{error}</h2>
          <button className="btn btn--primary" onClick={onLeave}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!state || !me) {
    return (
      <div className="page center-page">
        <div className="spinner" />
        <p className="lede">Connecting to the room…</p>
      </div>
    );
  }

  const othersTyping = [...typing.entries()]
    .filter(([id]) => id !== me.temporaryUserId)
    .map(([, name]) => name);

  return (
    <motion.div
      className={`chat ${gone ? "is-gone" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="chat__head">
        <IconButton label="Leave" onClick={() => setConfirmLeave(true)}>
          <BackIcon />
        </IconButton>
        <div className="chat__title">
          <h1>{state.roomName}</h1>
          <p>
            {state.roomCode} · {state.participants.length} inside
          </p>
        </div>
        <div className="chat__head-right">
          <Countdown expiresAt={state.expiresAt} onExpire={vanish} compact />
          <IconButton label="People" onClick={() => setPeopleOpen(true)}>
            <PeopleIcon />
          </IconButton>
        </div>
      </header>

      <div className="chat__faces" aria-hidden="true">
        {state.participants.slice(0, 7).map((p) => (
          <span key={p.temporaryUserId} title={p.displayName} style={{ background: `${p.color}33` }}>
            {p.emoji}
          </span>
        ))}
        {state.participants.length > 7 ? <span>+{state.participants.length - 7}</span> : null}
      </div>

      <div className="chat__stream">
        <div className="sys">
          You arrived as <b style={{ color: me.color }}>{me.emoji} {me.displayName}</b>
        </div>
        {state.messages.map((m) => (
          <Bubble
            key={m.id}
            message={m}
            self={m.temporaryUserId === me.temporaryUserId}
            replied={m.replyToId ? byId.get(m.replyToId) : null}
            selfId={me.temporaryUserId}
            onReply={setReply}
            onReact={react}
          />
        ))}
        <div ref={endRef} />
      </div>

      {othersTyping.length ? (
        <div className="typing">
          <span className="typing__dots">
            <i />
            <i />
            <i />
          </span>
          {othersTyping.slice(0, 2).join(", ")} {othersTyping.length === 1 ? "is" : "are"} writing
        </div>
      ) : (
        <div className="typing typing--spacer" />
      )}

      <form className="composer" onSubmit={send}>
        <AnimatePresence>
          {reply ? (
            <motion.div
              className="composer__reply"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <span>
                Replying to <b>{reply.displayName}</b> — {reply.text.slice(0, 48)}
              </span>
              <button type="button" onClick={() => setReply(null)} aria-label="Cancel reply">
                <XIcon />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="composer__row">
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder="Say something that can disappear…"
            maxLength={2000}
          />
          <motion.button
            className="send"
            type="submit"
            disabled={!text.trim()}
            whileTap={{ scale: 0.9 }}
            aria-label="Send"
          >
            <SendIcon />
          </motion.button>
        </div>
      </form>

      <Sheet open={peopleOpen} onClose={() => setPeopleOpen(false)} title={`Inside · ${state.participants.length}`}>
        <ul className="people">
          {state.participants.map((p) => (
            <li key={p.temporaryUserId}>
              <span className="people__dot" style={{ background: p.color }} />
              <span className="msg__avatar" style={{ background: `${p.color}22` }}>
                {p.emoji}
              </span>
              <span>
                {p.displayName}
                {p.temporaryUserId === me.temporaryUserId ? <small> you</small> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="disclaimer" style={{ marginTop: 16 }}>
          Identities last only as long as this room.
        </p>
      </Sheet>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this room?">
        <p className="lede">You can return with the code until it expires. After that, nothing remains.</p>
        <div className="sheet__actions">
          <button className="btn btn--ghost" onClick={() => setConfirmLeave(false)}>
            Stay
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              setConfirmLeave(false);
              onLeave();
            }}
          >
            <LeaveIcon /> Leave
          </button>
        </div>
      </Sheet>

      <AnimatePresence>
        {gone ? (
          <motion.div
            className="vanish"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="display">This room is gone.</h2>
            <p>Every word, every name — forgotten.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
