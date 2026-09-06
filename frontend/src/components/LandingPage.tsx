interface Props {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const FLOW_STEPS = [
  { title: "Create", detail: "Set a name, expiry, and optional password." },
  { title: "Share", detail: "Send the room code to whoever needs it." },
  { title: "Join", detail: "They enter the code — no account needed." },
  { title: "Chat", detail: "Talk in real time under a temporary identity." },
  { title: "Expire", detail: "The room and everything in it is deleted." },
];

const PRIVACY_POINTS = [
  "No phone number, email, or account required to chat.",
  "A fresh temporary identity is generated for every room you join.",
  "Messages and identities are deleted when the room expires.",
  "Room codes and passwords are never stored in plain text.",
];

export default function LandingPage({ onCreateRoom, onJoinRoom }: Props) {
  return (
    <div className="landing">
      <div className="landing__glow" aria-hidden="true" />

      <section className="hero">
        <div className="hero__content">
          <p className="hero__kicker">Temporary, anonymous group chat</p>
          <h1 className="hero__title">Chat freely. Leave nothing behind.</h1>
          <p className="hero__subtitle">
            Create a temporary chat room and connect instantly without sharing your phone number,
            email, or a permanent identity.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--large" onClick={onCreateRoom} type="button">
              Create a room
            </button>
            <button className="btn btn--ghost btn--large" onClick={onJoinRoom} type="button">
              Join with code
            </button>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="drift-bubble drift-bubble--1">Hey, room's set 👋</div>
          <div className="drift-bubble drift-bubble--2">See you at 6pm</div>
          <div className="drift-bubble drift-bubble--3">Deleted in 3… 2… 1…</div>
          <div className="drift-bubble drift-bubble--4">No sign-up needed</div>
        </div>
      </section>

      <section className="flow">
        <h2 className="flow__title">How a room works</h2>
        <ol className="flow__steps">
          {FLOW_STEPS.map((step, i) => (
            <li className="flow__step" key={step.title}>
              <div className="flow__step-marker">{i + 1}</div>
              <p className="flow__step-title">{step.title}</p>
              <p className="flow__step-detail">{step.detail}</p>
              {i < FLOW_STEPS.length - 1 && <span className="flow__connector" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>

      <section className="privacy">
        <div className="privacy__card glass">
          <h2 className="privacy__title">Built to disappear</h2>
          <ul className="privacy__list">
            {PRIVACY_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="privacy__disclaimer">
            BlinkChat reduces what's collected and stored, but no online service can guarantee
            absolute privacy or security. Avoid sharing anything you couldn't afford to have seen.
          </p>
        </div>
      </section>

      <footer className="landing__footer">
        <p>BlinkChat — nothing to remember, nothing left behind.</p>
      </footer>
    </div>
  );
}
