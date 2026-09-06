import { TemporaryIdentity } from "../types";

interface Props {
  participants: TemporaryIdentity[];
  selfId: string | null;
}

export default function ParticipantList({ participants, selfId }: Props) {
  return (
    <div className="participant-list">
      <p className="participant-list__title">In this room ({participants.length})</p>
      <ul className="participant-list__items">
        {participants.map((p) => (
          <li key={p.temporaryUserId} className="participant-list__item">
            <span className="participant-list__status" style={{ background: p.color }} aria-hidden="true" />
            <span className="participant-list__avatar" style={{ background: `${p.color}33` }}>
              {p.emoji}
            </span>
            <span className="participant-list__name">
              {p.displayName}
              {p.temporaryUserId === selfId && <span className="participant-list__you"> (you)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
