import { Schema, model, Document, Types } from "mongoose";

export interface MessageDocument extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  roomCode: string;
  temporaryUserId: string;
  displayName: string;
  emoji: string;
  color: string;
  text: string;
  replyToId: string | null;
  reactions: Map<string, string[]>; // emoji -> temporaryUserIds
  createdAt: Date;
  expiresAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
  roomCode: { type: String, required: true, index: true, uppercase: true },
  temporaryUserId: { type: String, required: true },
  displayName: { type: String, required: true },
  emoji: { type: String, required: true },
  color: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  replyToId: { type: String, default: null },
  reactions: { type: Map, of: [String], default: {} },
  createdAt: { type: Date, default: Date.now },
  // Mirrors the parent room's expiresAt so messages disappear with the room.
  expiresAt: { type: Date, required: true },
});

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Message = model<MessageDocument>("Message", messageSchema);
