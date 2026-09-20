export default function Mark({ size = 44, blinking = true, className = "" }) {
  return (
    <svg
      className={`mark ${blinking ? "mark--live" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lidTop" x1="10" y1="20" x2="54" y2="34">
          <stop offset="0%" stopColor="#c4b8ff" />
          <stop offset="100%" stopColor="#8b7cff" />
        </linearGradient>
        <linearGradient id="lidBot" x1="10" y1="44" x2="54" y2="30">
          <stop offset="0%" stopColor="#e6c58a" />
          <stop offset="100%" stopColor="#b8924a" />
        </linearGradient>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="mark__top"
        d="M10 32C18 18 46 18 54 32"
        stroke="url(#lidTop)"
        strokeWidth="2.6"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      <path
        className="mark__bot"
        d="M10 32C18 46 46 46 54 32"
        stroke="url(#lidBot)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle className="mark__spark" cx="16.5" cy="29.5" r="1.7" fill="#fff8e8" />
    </svg>
  );
}

export function Wordmark({ compact = false }) {
  return (
    <div className={`wordmark ${compact ? "wordmark--compact" : ""}`}>
      <Mark size={compact ? 28 : 36} />
      <div className="wordmark__text">
        <span className="wordmark__blink">blink</span>
        <span className="wordmark__chat">CHAT</span>
      </div>
    </div>
  );
}
