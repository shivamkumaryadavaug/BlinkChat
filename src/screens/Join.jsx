import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "../components/Mark.jsx";
import { BackIcon, Button, Field, IconButton } from "../components/ui.jsx";
import { checkRoom } from "../lib/api.js";
import { haptic } from "../lib/format.js";

function normalize(raw) {
  const alnum = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  if (alnum.length <= 4) return alnum;
  return `${alnum.slice(0, 4)}-${alnum.slice(4)}`;
}

export default function Join({ onBack, onJoined, initialCode = "" }) {
  const [code, setCode] = useState(normalize(initialCode));
  const [password, setPassword] = useState("");
  const [needPw, setNeedPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const hidden = useRef(null);

  const cells = useMemo(() => {
    const clean = code.replace("-", "").padEnd(8, " ");
    return clean.split("");
  }, [code]);

  useEffect(() => {
    hidden.current?.focus();
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    if (code.replace("-", "").length < 8) {
      setError("Enter the full room code.");
      return;
    }
    setBusy(true);
    try {
      const room = await checkRoom({
        roomCode: code,
        password: password || undefined,
      });
      haptic(18);
      onJoined(room.roomCode, password || undefined);
    } catch (err) {
      const msg = err.message || "Could not join the room.";
      if (msg.toLowerCase().includes("password")) setNeedPw(true);
      setError(msg);
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
        <p className="kicker">Enter a room</p>
        <h1 className="display">The code is the only key.</h1>
        <p className="lede">Type or paste what someone shared with you. No account needed.</p>

        <div className="code-wrap">
          <input
            ref={hidden}
            className="code-ghost"
            value={code}
            onChange={(e) => setCode(normalize(e.target.value))}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={16}
            aria-label="Room code"
            autoComplete="off"
          />
          <div className="code-cells" aria-hidden="true">
            {cells.map((ch, i) => (
              <span key={i} className={`code-cell ${ch !== " " ? "is-fill" : ""} ${i === 4 ? "is-gap" : ""}`}>
                {ch.trim()}
              </span>
            ))}
          </div>
        </div>
        <p className="field__hint" style={{ textAlign: "center" }}>
          Four letters, four numbers — like IRIS-4821
        </p>

        {needPw ? (
          <Field label="Password">
            <input
              className="input"
              type="password"
              value={password}
              placeholder="Room password"
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Field>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="form-shell__cta">
          <Button type="submit" size="lg" block disabled={busy || code.replace("-", "").length < 8}>
            {busy ? "Looking…" : "Join the room"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
