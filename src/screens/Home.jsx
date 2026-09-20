import { motion } from "framer-motion";
import { Wordmark } from "../components/Mark.jsx";
import { Button, KeyIcon, PlusIcon } from "../components/ui.jsx";
import { loadRecent } from "../lib/format.js";

const STEPS = [
  { n: "01", t: "Create", d: "Name it, set a life span, lock it if you wish." },
  { n: "02", t: "Share", d: "Send the room code. That’s the only key." },
  { n: "03", t: "Join", d: "They walk in. No account. No trace of who." },
  { n: "04", t: "Chat", d: "Talk in real time under a borrowed name." },
  { n: "05", t: "Expire", d: "The room, the names, the words — gone." },
];

const PILLARS = [
  "No phone, email, or account.",
  "A fresh identity for every room.",
  "Everything deletes when time is up.",
  "Codes and passwords are never stored in plain text.",
];

const PHANTOMS = [
  { who: "Silent Fox", text: "Room’s open — no names.", self: false },
  { who: "Ivory Moth", text: "See you at 6.", self: true },
  { who: "system", text: "Deleted in 3… 2… 1…", self: false },
];

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Home({ onCreate, onJoin, onRejoin }) {
  const recent = loadRecent();

  return (
    <motion.div
      className="page home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <header className="topbar">
        <Wordmark />
        <span className="pill">
          <span className="live-dot" />
          ephemeral
        </span>
      </header>

      <section className="hero-grid">
        <div>
          <motion.p className="kicker" variants={fade} initial="hidden" animate="show" custom={0}>
            Temporary, anonymous group chat
          </motion.p>
          <motion.h1
            className="display display--hero"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={1}
          >
            Chat freely.
            <em> Leave nothing behind.</em>
          </motion.h1>
          <motion.p className="lede" variants={fade} initial="hidden" animate="show" custom={2}>
            Open a vanishing room and talk in real time — without a phone number,
            an email, or a permanent identity.
          </motion.p>

          <motion.div
            className="hero-actions"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
          >
            <button className="action-card" onClick={onCreate}>
              <span className="action-card__icon">
                <PlusIcon />
              </span>
              <span>
                <strong>Create a room</strong>
                <small>Set a name, a timer, a lock.</small>
              </span>
            </button>
            <button className="action-card action-card--alt" onClick={onJoin}>
              <span className="action-card__icon">
                <KeyIcon />
              </span>
              <span>
                <strong>Join with code</strong>
                <small>Walk in. Leave no name.</small>
              </span>
            </button>
          </motion.div>
        </div>

        <motion.div
          className="phantom"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          aria-hidden="true"
        >
          <div className="phantom__chrome">
            <span className="live-dot" />
            <span>DUSK-4821</span>
            <span className="phantom__timer">00:12:41</span>
          </div>
          <div className="phantom__stream">
            {PHANTOMS.map((m, i) => (
              <div
                key={i}
                className={`phantom__msg ${m.self ? "is-self" : ""} ${m.who === "system" ? "is-sys" : ""}`}
                style={{ animationDelay: `${0.9 + i * 1.15}s` }}
              >
                {m.who !== "system" ? <span>{m.who}</span> : null}
                <p>{m.text}</p>
              </div>
            ))}
          </div>
          <div className="phantom__ash">the room forgets</div>
        </motion.div>
      </section>

      {recent.length > 0 ? (
        <section className="recent">
          <div className="section-head">
            <h2>Recently held</h2>
            <p>Codes only. Messages were never kept here.</p>
          </div>
          <div className="recent__row">
            {recent.map((r) => (
              <button key={r.roomCode} className="recent__chip" onClick={() => onRejoin(r.roomCode)}>
                <b>{r.roomCode}</b>
                <small>{r.roomName}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flow">
        <div className="section-head">
          <p className="kicker">The ritual</p>
          <h2>How a room works</h2>
        </div>
        <ol className="flow__steps">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              className="flow__step"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.06 }}
            >
              <span>{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="privacy">
        <div className="privacy__card">
          <p className="kicker">Built to disappear</p>
          <h2>
            Nothing to remember.
            <em> Nothing left behind.</em>
          </h2>
          <ul>
            {PILLARS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="disclaimer">
            BlinkChat reduces what is collected and stored, but no online service
            can guarantee absolute privacy. Don’t share anything you couldn’t
            afford to have seen.
          </p>
        </div>
      </section>

      <footer className="home-foot">
        <Wordmark compact />
        <p>BlinkChat — rooms that forget you.</p>
        <div className="home-foot__cta">
          <Button onClick={onCreate}>Create a room</Button>
          <Button variant="ghost" onClick={onJoin}>
            Join with code
          </Button>
        </div>
      </footer>
    </motion.div>
  );
}
