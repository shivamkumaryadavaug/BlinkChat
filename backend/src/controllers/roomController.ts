import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import sanitizeHtml from "sanitize-html";
import { Room } from "../models/Room";
import { normalizeRoomCode } from "../utils/roomCode";
import { createUniqueRoomCode, getActiveRoom } from "../services/roomService";
import { HttpError } from "../middleware/errorHandler";
import { EXPIRATION_MS, ExpirationOption } from "../types";

const VALID_EXPIRATIONS: ExpirationOption[] = ["1h", "6h", "24h", "7d"];
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

function sanitizeText(input: string, maxLength: number): string {
  const clean = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
  return clean.slice(0, maxLength);
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomName, expiration, maxParticipants, password } = req.body ?? {};

    if (!VALID_EXPIRATIONS.includes(expiration)) {
      throw new HttpError(400, "Invalid expiration option.");
    }

    const parsedMax = Number(maxParticipants);
    if (!Number.isInteger(parsedMax) || parsedMax < 2 || parsedMax > 200) {
      throw new HttpError(400, "Max participants must be an integer between 2 and 200.");
    }

    if (password !== undefined && password !== "" && typeof password !== "string") {
      throw new HttpError(400, "Invalid password.");
    }
    if (typeof password === "string" && password.length > 100) {
      throw new HttpError(400, "Password is too long.");
    }

    const cleanRoomName = roomName ? sanitizeText(String(roomName), 60) : "Untitled Room";
    const roomCode = await createUniqueRoomCode();
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    const expiresAt = new Date(Date.now() + EXPIRATION_MS[expiration as ExpirationOption]);

    const room = await Room.create({
      roomCode,
      roomName: cleanRoomName,
      passwordHash,
      maxParticipants: parsedMax,
      expiresAt,
    });

    res.status(201).json({
      roomCode: room.roomCode,
      roomName: room.roomName,
      expiresAt: room.expiresAt,
      maxParticipants: room.maxParticipants,
      hasPassword: Boolean(room.passwordHash),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Validates a join attempt (code exists, not expired, password correct,
 * room not full) WITHOUT reserving a seat - the seat is only claimed once
 * the client's socket actually connects and joins the Socket.IO room, so
 * we don't leak "phantom" occupied slots from people who validate but
 * never open the socket.
 */
export async function checkRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomCode, password } = req.body ?? {};
    if (!roomCode || typeof roomCode !== "string") {
      throw new HttpError(400, "Room code is required.");
    }

    const normalized = normalizeRoomCode(roomCode);
    const room = await getActiveRoom(normalized);

    if (!room) {
      throw new HttpError(404, "This room doesn't exist or has expired.");
    }

    if (room.passwordHash) {
      if (!password || typeof password !== "string") {
        throw new HttpError(401, "This room requires a password.");
      }
      const matches = await bcrypt.compare(password, room.passwordHash);
      if (!matches) {
        throw new HttpError(401, "Incorrect password.");
      }
    }

    res.json({
      roomCode: room.roomCode,
      roomName: room.roomName,
      expiresAt: room.expiresAt,
      maxParticipants: room.maxParticipants,
      activeParticipantCount: room.activeParticipantCount,
    });
  } catch (err) {
    next(err);
  }
}
