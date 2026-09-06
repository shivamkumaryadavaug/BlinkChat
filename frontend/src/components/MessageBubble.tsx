import { ChatMessage } from "../types";

interface Props {
  message: ChatMessage;
  isSelf: boolean;
  repliedTo?: ChatMessage;
  selfId: string | null;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
}

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🎉"];

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isSelf, repliedTo, selfId, onReply, onReact }: Props) {
  const activeReactions = Object.entries(message.reactions).filter(([, users]) => users.length > 0);

  return (
    <div className={`message ${isSelf ? "message--self" : ""}`}>
      {!isSelf && (
        <span className="message__avatar" style={{ background: `${message.color}33` }}>
          {message.emoji}
        </span>
      )}
      <div className="message__body">
        {!isSelf && (
          <p className="message__author" style={{ color: message.color }}>
            {message.displayName}
          </p>
        )}

        {repliedTo && (
          <div className="message__reply-context">
            <span className="message__reply-author">{repliedTo.displayName}</span>
            <span className="message__reply-text">{repliedTo.text.slice(0, 80)}</span>
          </div>
        )}

        <div className="message__bubble">
          <p className="message__text">{message.text}</p>
          <span className="message__time">{formatTime(message.createdAt)}</span>
        </div>

        {activeReactions.length > 0 && (
          <div className="message__reactions">
            {activeReactions.map(([emoji, users]) => (
              <button
                key={emoji}
                type="button"
                className={`reaction-pill ${selfId && users.includes(selfId) ? "reaction-pill--active" : ""}`}
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}

        <div className="message__actions">
          <button type="button" className="message__action" onClick={() => onReply(message)}>
            Reply
          </button>
          <div className="message__quick-reactions">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="message__quick-reaction"
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
