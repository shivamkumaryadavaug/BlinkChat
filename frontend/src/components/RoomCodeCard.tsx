import { useState } from "react";
import { RoomSummary } from "../types";

interface Props {
  room: RoomSummary;
  onJoin: () => void;
}

export default function RoomCodeCard({ room, onJoin }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable (permissions, insecure context) -
      // fail quietly, the code is still visible to copy by hand.
    }
  };

  const handleShare = async () => {
    const shareText = `Join my BlinkChat room "${room.roomName}" with code ${room.roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BlinkChat room", text: shareText });
      } catch {
        // User cancelled the share sheet - nothing to do.
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="room-code-card glass">
      <p className="room-code-card__eyebrow">Your room is live</p>
      <p className="room-code-card__code">{room.roomCode}</p>
      <p className="room-code-card__name">{room.roomName}</p>
      <div className="room-code-card__actions">
        <button className="btn btn--ghost" onClick={handleCopy} type="button">
          {copied ? "Copied" : "Copy code"}
        </button>
        <button className="btn btn--ghost" onClick={handleShare} type="button">
          Share
        </button>
      </div>
      <button className="btn btn--primary room-code-card__join" onClick={onJoin} type="button">
        Enter room
      </button>
    </div>
  );
}
