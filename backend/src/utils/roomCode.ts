import crypto from "crypto";
import { Room } from "../models/Room";
const WORDS=["BLUE","GOLD","JADE","RUBY","CORAL","PEARL","AMBER","TEAL","IVORY","ONYX","SILVER","CRIMSON","AZURE","OLIVE","CYAN","SLATE"];
const ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function pick<T>(a:T[]):T{return a[crypto.randomInt(a.length)];}
function token(n:number){let s="";for(let i=0;i<n;i++)s+=ALPHABET[crypto.randomInt(ALPHABET.length)];return s;}
function generateCandidate(){return `${pick(WORDS)}-${token(4)}-${token(3)}`;}
export async function generateUniqueRoomCode():Promise<string>{for(let i=0;i<20;i++){const c=generateCandidate();if(!await Room.exists({roomCode:c,isClosed:false}))return c;}throw new Error("Unable to generate unique room code.");}
export function normalizeRoomCode(raw:string){return raw.trim().toUpperCase().replace(/\s+/g,"");}
