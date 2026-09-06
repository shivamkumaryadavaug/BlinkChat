import { Room } from "../models/Room";
import { Message } from "../models/Message";
import { generateUniqueRoomCode } from "../utils/roomCode";

export async function createUniqueRoomCode() { return generateUniqueRoomCode(); }
export async function getActiveRoom(roomCode: string) {
  const room=await Room.findOne({roomCode,isClosed:false});
  if(!room || room.expiresAt.getTime()<=Date.now()) return null;
  return room;
}
export async function getRecentMessages(roomCode:string){ return Message.find({roomCode}).sort({createdAt:1}).limit(200); }
export async function deleteExpiredRoomData(roomCode:string){ await Message.deleteMany({roomCode}); await Room.deleteOne({roomCode}); }
