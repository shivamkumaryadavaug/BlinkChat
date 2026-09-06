export type ExpirationOption = "1h" | "6h" | "24h" | "7d";

export const EXPIRATION_MS: Record<ExpirationOption, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export interface TemporaryIdentity {
  temporaryUserId: string; // random id, scoped to this room + socket session
  displayName: string; // e.g. "Silent Fox"
  emoji: string; // e.g. "🦊"
  color: string; // hex, used for avatar background
}

export interface CreateRoomInput {
  roomName?: string;
  expiration: ExpirationOption;
  maxParticipants: number;
  password?: string;
}

export interface JoinRoomInput {
  roomCode: string;
  password?: string;
}

export interface ClientToServerEvents {
  "room:join": (
    payload: { roomCode: string; password?: string; sessionId?: string },
    ack: (res: { ok: true; identity: TemporaryIdentity; sessionId: string } | { ok: false; error: string }) => void
  ) => void;
  "message:send": (payload: { roomCode: string; text: string; replyToId?: string }) => void;
  "typing:start": (payload: { roomCode: string }) => void;
  "typing:stop": (payload: { roomCode: string }) => void;
  "reaction:add": (payload: { roomCode: string; messageId: string; emoji: string }) => void;
  "room:leave": (payload: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  "room:state": (payload: RoomStatePayload) => void;
  "message:new": (payload: ChatMessagePayload) => void;
  "reaction:update": (payload: { messageId: string; reactions: Record<string, string[]> }) => void;
  "participant:joined": (payload: { identity: TemporaryIdentity; participantCount: number }) => void;
  "participant:left": (payload: { temporaryUserId: string; displayName: string; participantCount: number }) => void;
  "typing:update": (payload: { temporaryUserId: string; displayName: string; isTyping: boolean }) => void;
  "room:expired": () => void;
  "room:error": (payload: { error: string }) => void;
}

export interface RoomStatePayload {
  roomCode: string;
  roomName: string;
  expiresAt: string;
  participants: TemporaryIdentity[];
  messages: ChatMessagePayload[];
}

export interface ChatMessagePayload {
  id: string;
  temporaryUserId: string;
  displayName: string;
  emoji: string;
  color: string;
  text: string;
  createdAt: string;
  replyToId?: string;
  reactions: Record<string, string[]>; // emoji -> array of temporaryUserIds
}
