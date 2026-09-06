import { Server } from "socket.io";
import { Room } from "../models/Room";
import { Message } from "../models/Message";
import { ClientToServerEvents, ServerToClientEvents } from "../types";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Backend-driven cleanup, independent of MongoDB's TTL background task
 * (which only guarantees deletion "eventually", typically within 60s of
 * expiry, and only runs on the DB side). This sweep:
 *   1. Finds rooms whose expiresAt has passed but are not yet closed.
 *   2. Notifies connected clients so they're disconnected immediately.
 *   3. Deletes the room's messages right away.
 *   4. Marks the room closed (and deletes the room doc shortly after,
 *      once TTL catches up, or immediately here to not depend on it).
 */
export function startCleanupSweep(io: AppServer, intervalMs: number): NodeJS.Timeout {
  const sweep = async () => {
    try {
      const expiredRooms = await Room.find({
        expiresAt: { $lte: new Date() },
        isClosed: false,
      });

      for (const room of expiredRooms) {
        io.to(room.roomCode).emit("room:expired");
        io.socketsLeave(room.roomCode);

        await Message.deleteMany({ roomId: room._id });
        room.isClosed = true;
        room.activeParticipantCount = 0;
        await room.save();

        // Delete room metadata now rather than waiting on the TTL index,
        // since the room is already fully expired and closed.
        await Room.deleteOne({ _id: room._id });
      }
    } catch (err) {
      console.error("[cleanup] sweep failed:", err);
    }
  };

  // Run once immediately, then on the configured interval.
  void sweep();
  return setInterval(sweep, intervalMs);
}
