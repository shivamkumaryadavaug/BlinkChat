import express from "express";
import cors from "cors";
import http from "http";
import crypto from "crypto";
import { Server } from "socket.io";

const PORT = 8787;
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  pingTimeout: 25000,
  pingInterval: 20000,
});

const WORDS = [
  "IRIS", "AURA", "NOVA", "MIST", "LUNE", "OPAL", "JADE", "ONYX",
  "BLUE", "GOLD", "SAGE", "LYNX", "VELA", "DUSK", "WAVE", "SILK",
  "FERN", "RUBY", "PEAR", "COAL", "ASHY", "ZEST", "MOON", "DAWN",
];

const ADJ = [
  "Silent", "Velvet", "Amber", "Hidden", "Drift", "Ivory", "Quiet",
  "Lunar", "Fable", "Misty", "Copper", "Hollow", "Silver", "Wild",
  "Pale", "Noble", "Swift", "Soft", "Vivid", "Still",
];

const NOUN = [
  "Fox", "Moth", "Heron", "Koi", "Wren", "Lynx", "Opal", "Crow",
  "Hare", "Fern", "Otter", "Ivy", "Sparrow", "Nix", "Ash", "Dove",
  "Wolf", "Iris", "Finch", "Sage",
];

const EMOJI = [
  "🦊", "🦋", "🦢", "🐟", "🐦", "🐈", "💎", "🐦‍⬛",
  "🐇", "🌿", "🦦", "🍃", "🕊️", "🌙", "🪶", "🤍",
  "🐺", "🌸", "🐤", "🍵",
];

const COLORS = [
  "#c4b5fd", "#fbbf77", "#5eead4", "#fda4af", "#93c5fd",
  "#f9a8d4", "#a7f3d0", "#fde68a", "#fbcfe8", "#99f6e4",
  "#fdba74", "#a5b4fc", "#fca5a5", "#d8b4fe", "#86efac",
];

const EXPIRY = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 };

const rooms = new Map();

function hashPassword(pw) {
  if (!pw) return null;
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

function mintCode() {
  for (let i = 0; i < 40; i++) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const code = `${word}-${num}`;
    if (![...rooms.keys()].some((k) => k.toUpperCase() === code)) return code;
  }
  return `NOVA-${Date.now().toString().slice(-4)}`;
}

function mintIdentity(usedNames = new Set()) {
  for (let n = 0; n < 80; n++) {
    const i = Math.floor(Math.random() * ADJ.length);
    const j = Math.floor(Math.random() * NOUN.length);
    const displayName = `${ADJ[i]} ${NOUN[j]}`;
    if (usedNames.has(displayName)) continue;
    return {
      temporaryUserId: crypto.randomUUID(),
      displayName,
      emoji: EMOJI[j % EMOJI.length],
      color: COLORS[(i + j) % COLORS.length],
    };
  }
  return {
    temporaryUserId: crypto.randomUUID(),
    displayName: `Quiet ${NOUN[Math.floor(Math.random() * NOUN.length)]}`,
    emoji: "🌙",
    color: COLORS[0],
  };
}

function publicRoom(room) {
  return {
    roomCode: room.roomCode,
    roomName: room.roomName,
    expiresAt: room.expiresAt,
    maxParticipants: room.maxParticipants,
    hasPassword: Boolean(room.passwordHash),
    participants: [...room.participants.values()].map((p) => p.identity),
    messages: room.messages,
  };
}

function destroyRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearTimeout(room.timer);
  io.to(code).emit("room:expired");
  io.in(code).socketsLeave(code);
  rooms.delete(code);
}

function scheduleExpiry(room) {
  const wait = Math.max(0, room.expiresAt - Date.now());
  room.timer = setTimeout(() => destroyRoom(room.roomCode), wait);
}

app.get("/api/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

app.post("/api/rooms", (req, res) => {
  const { roomName, expiration = "6h", maxParticipants = 20, password } = req.body || {};
  const ms = EXPIRY[expiration] ?? EXPIRY["6h"];
  const max = Math.min(100, Math.max(2, Number(maxParticipants) || 20));
  const roomCode = mintCode();
  const name = String(roomName || "").trim().slice(0, 60) || "Vanishing room";
  const room = {
    roomCode,
    roomName: name,
    passwordHash: hashPassword(password),
    maxParticipants: max,
    expiresAt: Date.now() + ms,
    createdAt: Date.now(),
    messages: [],
    participants: new Map(),
    sessions: new Map(),
    timer: null,
  };
  scheduleExpiry(room);
  rooms.set(roomCode, room);
  res.json({
    roomCode,
    roomName: name,
    expiresAt: room.expiresAt,
    maxParticipants: max,
    hasPassword: Boolean(room.passwordHash),
  });
});

app.post("/api/rooms/check", (req, res) => {
  const roomCode = String(req.body?.roomCode || "").toUpperCase().trim();
  const password = req.body?.password;
  const room = rooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "This room doesn’t exist — or it already vanished." });
  if (room.expiresAt <= Date.now()) {
    destroyRoom(roomCode);
    return res.status(410).json({ error: "This room has expired and was deleted." });
  }
  if (room.passwordHash) {
    if (!password) return res.status(401).json({ error: "This room requires a password." });
    if (hashPassword(password) !== room.passwordHash) {
      return res.status(401).json({ error: "That password isn’t right." });
    }
  }
  if (room.participants.size >= room.maxParticipants) {
    return res.status(403).json({ error: "This room is full." });
  }
  res.json({
    roomCode: room.roomCode,
    roomName: room.roomName,
    expiresAt: room.expiresAt,
    requiresPassword: Boolean(room.passwordHash),
  });
});

io.on("connection", (socket) => {
  socket.data.roomCode = null;
  socket.data.identity = null;

  socket.on("room:join", ({ roomCode, password, sessionId } = {}, cb) => {
    const code = String(roomCode || "").toUpperCase().trim();
    const room = rooms.get(code);
    const reply = typeof cb === "function" ? cb : () => {};

    if (!room) return reply({ ok: false, error: "This room doesn’t exist — or it already vanished." });
    if (room.expiresAt <= Date.now()) {
      destroyRoom(code);
      return reply({ ok: false, error: "This room has expired and was deleted." });
    }
    if (room.passwordHash) {
      if (hashPassword(password) !== room.passwordHash) {
        return reply({ ok: false, error: "That password isn’t right." });
      }
    }

    let identity = null;
    if (sessionId && room.sessions.has(sessionId)) {
      identity = room.sessions.get(sessionId);
    } else {
      if (room.participants.size >= room.maxParticipants) {
        return reply({ ok: false, error: "This room is full." });
      }
      const used = new Set([...room.participants.values()].map((p) => p.identity.displayName));
      identity = mintIdentity(used);
    }

    const sid = sessionId && room.sessions.has(sessionId) ? sessionId : crypto.randomUUID();
    room.sessions.set(sid, identity);

    if (socket.data.roomCode && socket.data.roomCode !== code) {
      socket.leave(socket.data.roomCode);
    }

    const already = [...room.participants.values()].some(
      (p) => p.identity.temporaryUserId === identity.temporaryUserId
    );

    room.participants.set(socket.id, { identity, sessionId: sid });
    socket.data.roomCode = code;
    socket.data.identity = identity;
    socket.join(code);

    reply({ ok: true, identity, sessionId: sid });
    socket.emit("room:state", publicRoom(room));

    if (!already) {
      socket.to(code).emit("participant:joined", {
        identity,
        participantCount: room.participants.size,
      });
    }
  });

  socket.on("message:send", ({ roomCode, text, replyToId } = {}) => {
    const code = socket.data.roomCode;
    if (!code || (roomCode && String(roomCode).toUpperCase() !== code)) return;
    const room = rooms.get(code);
    const identity = socket.data.identity;
    if (!room || !identity) return;
    const trimmed = String(text || "").trim().slice(0, 2000);
    if (!trimmed) return;
    const message = {
      id: crypto.randomUUID(),
      text: trimmed,
      displayName: identity.displayName,
      emoji: identity.emoji,
      color: identity.color,
      temporaryUserId: identity.temporaryUserId,
      createdAt: Date.now(),
      reactions: {},
      replyToId: replyToId || null,
    };
    room.messages.push(message);
    if (room.messages.length > 400) room.messages.splice(0, room.messages.length - 400);
    io.to(code).emit("message:new", message);
  });

  socket.on("reaction:add", ({ roomCode, messageId, emoji } = {}) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    const identity = socket.data.identity;
    if (!room || !identity || !messageId || !emoji) return;
    const msg = room.messages.find((m) => m.id === messageId);
    if (!msg) return;
    const key = String(emoji).slice(0, 8);
    if (!msg.reactions[key]) msg.reactions[key] = [];
    const i = msg.reactions[key].indexOf(identity.temporaryUserId);
    if (i >= 0) msg.reactions[key].splice(i, 1);
    else msg.reactions[key].push(identity.temporaryUserId);
    if (msg.reactions[key].length === 0) delete msg.reactions[key];
    io.to(code).emit("reaction:update", { messageId, reactions: msg.reactions });
  });

  const emitTyping = (isTyping) => {
    const code = socket.data.roomCode;
    const identity = socket.data.identity;
    if (!code || !identity) return;
    socket.to(code).emit("typing:update", {
      temporaryUserId: identity.temporaryUserId,
      displayName: identity.displayName,
      isTyping,
    });
  };

  socket.on("typing:start", () => emitTyping(true));
  socket.on("typing:stop", () => emitTyping(false));

  const leave = () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    const identity = socket.data.identity;
    room?.participants.delete(socket.id);
    socket.leave(code);
    if (identity && room) {
      const stillHere = [...room.participants.values()].some(
        (p) => p.identity.temporaryUserId === identity.temporaryUserId
      );
      if (!stillHere) {
        socket.to(code).emit("participant:left", { temporaryUserId: identity.temporaryUserId });
      }
    }
    socket.data.roomCode = null;
    socket.data.identity = null;
  };

  socket.on("room:leave", leave);
  socket.on("disconnect", leave);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BlinkChat server on :${PORT}`);
});
