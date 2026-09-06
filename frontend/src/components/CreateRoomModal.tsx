import { FormEvent, useState } from "react";
import { createRoom } from "../api/client";
import { ExpirationOption, RoomSummary } from "../types";
import RoomCodeCard from "./RoomCodeCard";

interface Props {
  onClose: () => void;
  onEnterRoom: (roomCode: string, password?: string) => void;
}

const EXPIRATION_OPTIONS: { value: ExpirationOption; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export default function CreateRoomModal({ onClose, onEnterRoom }: Props) {
  const [roomName, setRoomName] = useState("");
  const [expiration, setExpiration] = useState<ExpirationOption>("6h");
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<RoomSummary | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const room = await createRoom({
        roomName: roomName.trim() || undefined,
        expiration,
        maxParticipants,
        password: password || undefined,
      });
      setCreatedRoom(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the room.");
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

        {!createdRoom ? (
          <>
            <h2 className="modal__title">Create a temporary room</h2>
            <p className="modal__subtitle">No sign-up. The room disappears on its own when time's up.</p>

            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="field__label">Room name (optional)</span>
                <input
                  className="field__input"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Study Group — DBMS"
                  maxLength={60}
                />
              </label>

              <label className="field">
                <span className="field__label">Expires after</span>
                <div className="chip-group">
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`chip ${expiration === opt.value ? "chip--active" : ""}`}
                      onClick={() => setExpiration(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="field">
                <span className="field__label">Max participants: {maxParticipants}</span>
                <input
                  type="range"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="field__range"
                />
              </label>

              <label className="field">
                <span className="field__label">Password (optional)</span>
                <input
                  className="field__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for an open room"
                  maxLength={100}
                />
              </label>

              {error && <p className="form__error">{error}</p>}

              <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create temporary room"}
              </button>
            </form>
          </>
        ) : (
          <RoomCodeCard room={createdRoom} onJoin={() => onEnterRoom(createdRoom.roomCode, password || undefined)} />
        )}
      </div>
    </div>
  );
}
