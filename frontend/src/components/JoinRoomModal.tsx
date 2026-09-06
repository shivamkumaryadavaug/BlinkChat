import { FormEvent, useState } from "react";
import { checkRoom } from "../api/client";

interface Props {
  onClose: () => void;
  onEnterRoom: (roomCode: string, password?: string) => void;
  initialCode?: string;
}

export default function JoinRoomModal({ onClose, onEnterRoom, initialCode }: Props) {
  const [roomCode, setRoomCode] = useState(initialCode ?? "");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const room = await checkRoom({ roomCode, password: password || undefined });
      onEnterRoom(room.roomCode, password || undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not join the room.";
      if (message.toLowerCase().includes("password")) {
        setNeedsPassword(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal glass">
        <button className="modal__close" onClick={onClose} aria-label="Close" type="button">
          ✕
        </button>

        <h2 className="modal__title">Join a temporary room</h2>
        <p className="modal__subtitle">Enter the code someone shared with you.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Room code</span>
            <input
              className="field__input field__input--code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="BLUE-4821"
              maxLength={16}
              autoFocus
            />
          </label>

          {needsPassword && (
            <label className="field">
              <span className="field__label">Password</span>
              <input
                className="field__input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password"
                autoFocus
              />
            </label>
          )}

          {error && <p className="form__error">{error}</p>}

          <button className="btn btn--primary btn--full" type="submit" disabled={loading || !roomCode.trim()}>
            {loading ? "Checking…" : "Join room"}
          </button>
        </form>
      </div>
    </div>
  );
}
