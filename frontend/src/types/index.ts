export type ExpirationOption = "1h" | "6h" | "24h" | "7d";

export interface TemporaryIdentity {
  temporaryUserId: string;
  displayName: string;
  emoji: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  temporaryUserId: string;
  displayName: string;
  emoji: string;
  color: string;
  text: string;
  createdAt: string;
  replyToId?: string;
  reactions: Record<string, string[]>;
}

export interface RoomSummary {
  roomCode: string;
  roomName: string;
  expiresAt: string;
  maxParticipants: number;
  hasPassword?: boolean;
  activeParticipantCount?: number;
}

export interface RoomState {
  roomCode: string;
  roomName: string;
  expiresAt: string;
  participants: TemporaryIdentity[];
  messages: ChatMessage[];
}
