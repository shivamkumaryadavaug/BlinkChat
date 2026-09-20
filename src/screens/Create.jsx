import { useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "../components/Mark.jsx";
import { BackIcon, Button, Field, IconButton } from "../components/ui.jsx";
import { createRoom } from "../lib/api.js";
import { haptic } from "../lib/format.js";

const LIVES = [
  { value: "1h", label: "1 hour", hint: "A briefing" },
  { value: "6h", label: "6 hours", hint: "An evening" },
  { value: "24h", label: "24 hours", hint: "A day" },
  { value: "7d", label: "7 days", hint: "A week" },
];

export default function Create({ onBack, onCreated }) {
  const [name, setName] = useState("");
  const [life, setLife] = useState("6h");
  const [max, setMax] = useState(20);
  const [password, setPassword] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const room = await createRoom({
        roomName: name.trim() || undefined,
        expiration: life,
        maxParticipants: max,
        password: locked && password ? password : undefined,
      });
      haptic(18);
      onCreated(room, locked ? password : undefined);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="page page--form"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="topbar">
        <IconButton label="Back" onClick={onBack}>
          <BackIcon />
        </IconButton>
        <Wordmark compact />
        <span className="topbar__ghost" />
      </header>

      <form className="form-shell" onSubmit={submit}>
        <p className="kicker">New vanishing room</p>
        <h1 className="display">Open a room that knows how to leave.</h1>
        <p className="lede">No sign-up. It dissolves on its own when the time is up.</p>

        <Field label="Room name" hint="Optional. A hint for whoever you invite.">
          <input
            className="input"
            value={name}
            maxLength={60}
            placeholder="e.g. Study circle — dusk"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Lives for">
          <div className="life-grid">
            {LIVES.map((l) => (
              <button
                key={l.value}
                type="button"
                className={`life ${life === l.value ? "is-on" : ""}`}
                onClick={() => setLife(l.value)}
              >
                <b>{l.label}</b>
                <small>{l.hint}</small>
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Max people · ${max}`}>
          <div className="range-wrap">
            <input
              className="range"
              type="range"
              min={2}
              max={100}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
            <div className="range__ends">
              <span>2</span>
              <span>100</span>
            </div>
          </div>
        </Field>

        <button
          type="button"
          className={`lock-toggle ${locked ? "is-on" : ""}`}
          onClick={() => setLocked((v) => !v)}
        >
          <span className="lock-toggle__knob" />
          <span>
            <strong>Lock with a password</strong>
            <small>Leave off for an open room.</small>
          </span>
        </button>

        {locked ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
            <Field label="Password">
              <input
                className="input"
                type="password"
                value={password}
                maxLength={100}
                placeholder="A phrase only your people know"
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </Field>
          </motion.div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="form-shell__cta">
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? "Opening…" : "Open the room"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
