import { Schema, model, Document, Types } from "mongoose";

export interface RoomDocument extends Document {
  _id: Types.ObjectId;
  roomCode: string;
  roomName: string;
  passwordHash: string | null;
  maxParticipants: number;
  activeParticipantCount: number;
  createdAt: Date;
  expiresAt: Date;
  isClosed: boolean;
}

const roomSchema = new Schema<RoomDocument>({
  roomCode: { type: String, required: true, unique: true, index: true, uppercase: true },
  roomName: { type: String, default: "Untitled Room", maxlength: 60 },
  passwordHash: { type: String, default: null },
  maxParticipants: { type: Number, required: true, min: 2, max: 200 },
  activeParticipantCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isClosed: { type: Boolean, default: false },
});

// MongoDB TTL index: the document is auto-removed once expiresAt passes.
// This is a safety net, not the primary deletion mechanism - see
// utils/cleanup.ts for the backend-driven sweep that closes rooms promptly
// and deletes their messages, independent of TTL timing.
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Room = model<RoomDocument>("Room", roomSchema);
