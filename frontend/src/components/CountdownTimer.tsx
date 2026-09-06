import { useEffect, useState } from "react";

interface Props {
  expiresAt: string;
  onExpire?: () => void;
  compact?: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function CountdownTimer({ expiresAt, onExpire, compact }: Props) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div className={`countdown ${compact ? "countdown--compact" : ""} ${isUrgent ? "countdown--urgent" : ""}`}>
      <span className="countdown__dot" aria-hidden="true" />
      <span className="countdown__label">Room expires in</span>
      <span className="countdown__value">{formatRemaining(remaining)}</span>
    </div>
  );
}
