import { Server, Socket } from "socket.io";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Room } from "../models/Room";
import { Message } from "../models/Message";
import { generateTemporaryIdentity } from "../utils/identity";
import { normalizeRoomCode } from "../utils/roomCode";
import { getActiveRoom, getRecentMessages } from "../services/roomService";
import { ClientToServerEvents, ServerToClientEvents, TemporaryIdentity, ChatMessagePayload } from "../types";

type AppServer=Server<ClientToServerEvents,ServerToClientEvents>;
type AppSocket=Socket<ClientToServerEvents,ServerToClientEvents>;
interface SocketSession { roomCode:string; identity:TemporaryIdentity; sessionId:string; }
const sessions=new Map<string,SocketSession>();
const resumable=new Map<string,{roomCode:string;identity:TemporaryIdentity;expiresAt:number}>();
const windows=new Map<string,number[]>();
const locks=new Map<string,Promise<void>>();

function allowed(id:string,event:string,limit:number,windowMs:number){const key=`${id}:${event}`,now=Date.now();const a=(windows.get(key)??[]).filter(t=>now-t<windowMs);if(a.length>=limit){windows.set(key,a);return false;}a.push(now);windows.set(key,a);return true;}
function withRoomLock<T>(roomCode:string,fn:()=>Promise<T>):Promise<T>{const prev=locks.get(roomCode)??Promise.resolve();let release!:()=>void;const gate=new Promise<void>(r=>release=r);locks.set(roomCode,prev.then(()=>gate));return prev.then(fn).finally(()=>{release(); if(locks.get(roomCode)===gate) locks.delete(roomCode);});}
function clean(raw:string){return sanitizeHtml(raw,{allowedTags:[],allowedAttributes:{}}).trim().slice(0,2000);}
function payload(doc:any):ChatMessagePayload{return {id:String(doc._id),temporaryUserId:doc.temporaryUserId,displayName:doc.displayName,emoji:doc.emoji,color:doc.color,text:doc.text,createdAt:doc.createdAt.toISOString(),replyToId:doc.replyToId??undefined,reactions:Object.fromEntries(doc.reactions??new Map())};}
function participants(io:AppServer,code:string){const r=io.sockets.adapter.rooms.get(code);if(!r)return [];const out:TemporaryIdentity[]=[];for(const id of r){const s=sessions.get(id);if(s)out.push(s.identity);}return out;}
function cleanupResumable(){const now=Date.now();for(const [k,v] of resumable)if(v.expiresAt<=now)resumable.delete(k);}

export function registerChatSocket(io:AppServer){setInterval(cleanupResumable,60_000).unref();
io.on("connection",socket=>{
 const s=socket as AppSocket;
 s.on("room:join",async(p:any,ack:any)=>{try{
  if(!allowed(s.id,"join",8,60_000))return ack({ok:false,error:"Too many join attempts. Please wait."});
  const code=normalizeRoomCode(p?.roomCode??""); const requestedSession=typeof p?.sessionId==="string"&&p.sessionId.length<=128?p.sessionId:"";
  const result=await withRoomLock(code,async()=>{
   const room=await getActiveRoom(code); if(!room)return {ok:false as const,error:"This room doesn't exist or has expired."};
   const resumed=requestedSession?resumable.get(requestedSession):undefined;
   let identity:TemporaryIdentity,sessionId:string,already=false;
   if(resumed&&resumed.roomCode===code){identity=resumed.identity;sessionId=requestedSession;already=true;resumable.delete(requestedSession);} else {
    if(participants(io,code).length>=room.maxParticipants)return {ok:false as const,error:"This room is full."};
    if(room.passwordHash){if(!p?.password)return {ok:false as const,error:"This room requires a password."};if(!await bcrypt.compare(p.password,room.passwordHash))return {ok:false as const,error:"Incorrect password."};}
    const names=new Set(participants(io,code).map(x=>x.displayName)); identity=generateTemporaryIdentity();for(let i=0;names.has(identity.displayName)&&i<100;i++)identity=generateTemporaryIdentity();if(names.has(identity.displayName))identity.displayName+=` #${crypto.randomInt(100,1000)}`;sessionId=crypto.randomBytes(24).toString("base64url");
   }
   sessions.set(s.id,{roomCode:code,identity,sessionId});await s.join(code);
   const msgs=await getRecentMessages(code);const list=participants(io,code);
   ack({ok:true,identity,sessionId});s.emit("room:state",{roomCode:room.roomCode,roomName:room.roomName,expiresAt:room.expiresAt.toISOString(),participants:list,messages:msgs.map(payload)});
   if(!already)s.to(code).emit("participant:joined",{identity,participantCount:list.length});
   return {ok:true as const};
  }); if(!result.ok)ack(result);
 }catch(e){console.error("[socket] join",e);ack({ok:false,error:"Something went wrong while joining the room."});}});
 s.on("message:send",async(p:any)=>{try{const session=sessions.get(s.id);const code=normalizeRoomCode(p?.roomCode??"");if(!session||session.roomCode!==code)return;if(!allowed(s.id,"message",12,10_000))return s.emit("room:error",{error:"You are sending messages too quickly."});const text=clean(p?.text??"");if(!text)return;const room=await getActiveRoom(code);if(!room)return s.emit("room:error",{error:"This room has expired."});const doc=await Message.create({roomId:room._id,roomCode:code,temporaryUserId:session.identity.temporaryUserId,displayName:session.identity.displayName,emoji:session.identity.emoji,color:session.identity.color,text,replyToId:p?.replyToId??null,expiresAt:room.expiresAt});io.to(code).emit("message:new",payload(doc));}catch(e){console.error("[socket] message",e);}});
 s.on("typing:start",(p:any)=>{const x=sessions.get(s.id),code=normalizeRoomCode(p?.roomCode??"");if(x&&x.roomCode===code&&allowed(s.id,"typing",6,3000))s.to(code).emit("typing:update",{temporaryUserId:x.identity.temporaryUserId,displayName:x.identity.displayName,isTyping:true});});
 s.on("typing:stop",(p:any)=>{const x=sessions.get(s.id),code=normalizeRoomCode(p?.roomCode??"");if(x&&x.roomCode===code)s.to(code).emit("typing:update",{temporaryUserId:x.identity.temporaryUserId,displayName:x.identity.displayName,isTyping:false});});
 s.on("reaction:add",async(p:any)=>{try{const x=sessions.get(s.id),code=normalizeRoomCode(p?.roomCode??"");if(!x||x.roomCode!==code||!allowed(s.id,"reaction",20,10_000))return;const emojis=new Set(["❤️","😂","👍","😮","😢","🎉"]);if(!emojis.has(p?.emoji))return;const room=await getActiveRoom(code);if(!room)return;const m=await Message.findOne({_id:p?.messageId,roomCode:code});if(!m)return;const cur=m.reactions.get(p.emoji)??[],id=x.identity.temporaryUserId;m.reactions.set(p.emoji,cur.includes(id)?cur.filter(v=>v!==id):[...cur,id]);await m.save();io.to(code).emit("reaction:update",{messageId:String(m._id),reactions:Object.fromEntries(m.reactions)});}catch(e){console.error("[socket] reaction",e);}});
 const leave=async(keep=true)=>{const x=sessions.get(s.id);if(!x)return;sessions.delete(s.id);for(const k of [...windows.keys()])if(k.startsWith(`${s.id}:`))windows.delete(k);await s.leave(x.roomCode);if(keep)resumable.set(x.sessionId,{roomCode:x.roomCode,identity:x.identity,expiresAt:Date.now()+5*60_000});const count=participants(io,x.roomCode).length;io.to(x.roomCode).emit("participant:left",{temporaryUserId:x.identity.temporaryUserId,displayName:x.identity.displayName,participantCount:count});};
 s.on("room:leave",async(p:any)=>{const x=sessions.get(s.id);if(x&&x.roomCode===normalizeRoomCode(p?.roomCode??""))await leave(false);});s.on("disconnect",()=>void leave(true));
});}
