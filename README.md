# BlinkChat

Temporary, anonymous group chat. No phone numbers, no email, no permanent
usernames, no permanent history.

**Create → Share Code → Join → Chat → Expire → Automatically Delete**

---

## 1. What's in this repo

```
blinkchat/
├── backend/     Node.js + Express + Socket.IO + MongoDB (TypeScript)
└── frontend/    React + TypeScript + Vite
```

### Core features implemented

- Create a room with an optional name, expiration (1h / 6h / 24h / 7d),
  max participants, and an optional password (bcrypt-hashed).
- Unique, human-shareable room codes (e.g. `BLUE-4821`).
- Join a room by code with clear errors for invalid/expired/full/wrong
  password cases.
- A brand-new, room-scoped temporary identity (name + emoji + color) is
  generated every time someone joins — never a persistent profile.
- Real-time chat over Socket.IO: instant messages, timestamps, typing
  indicators, replies, emoji reactions, join/leave notifications, and a
  live online participant count.
- A visible expiration countdown, with the room and its messages force-
  deleted the moment it hits zero — both by a backend sweep and by
  MongoDB TTL indexes as a safety net.
- Security basics: helmet, CORS allow-list, rate limiting, input
  sanitization (XSS-safe), bcrypt password hashing, no secrets or stack
  traces sent to the client.

### Structured for (not yet built)

The schema and folder layout leave room for the "Version 2 / 3" features
from the brief (image/file sharing, voice rooms, polls, QR join, E2EE,
moderation tools, etc.) without a rewrite — see `backend/src/types` and
`Message`/`Room` models for where those would extend.

---

## 2. Prerequisites

- Node.js 18+
- A MongoDB instance — local (`mongod`) or a free tier on MongoDB Atlas

---

## 3. Local development

### Backend

```bash
cd backend
cp .env.example .env
# edit .env if your Mongo URI or ports differ
npm install
npm run dev
```

The API + Socket.IO server starts on `http://localhost:4000` by default.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app starts on `http://localhost:5173` and talks to the backend via
`VITE_SERVER_URL`.

Open the frontend URL in two browser windows to try creating a room in
one and joining it with the code in the other.

---

## 4. Environment variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `4000`) |
| `CLIENT_ORIGIN` | Comma-separated allowed origins for CORS/Socket.IO |
| `MONGODB_URI` | MongoDB connection string |
| `BCRYPT_SALT_ROUNDS` | Cost factor for password hashing |
| `CLEANUP_INTERVAL_MS` | How often the expiry sweep runs |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | API rate limiting |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_SERVER_URL` | Base URL of the backend (REST + Socket.IO) |

---

## 5. Database schema

**`rooms`**

| Field | Type | Notes |
|---|---|---|
| `roomCode` | string | Unique, e.g. `BLUE-4821` |
| `roomName` | string | Defaults to "Untitled Room" |
| `passwordHash` | string \| null | bcrypt hash, never the raw password |
| `maxParticipants` | number | 2–200 |
| `activeParticipantCount` | number | Live count of connected sockets |
| `createdAt` / `expiresAt` | Date | `expiresAt` drives the TTL index |
| `isClosed` | boolean | Set by the cleanup sweep |

**`messages`**

| Field | Type | Notes |
|---|---|---|
| `roomId` / `roomCode` | ref / string | Links back to the room |
| `temporaryUserId` | string | Room-scoped identity id |
| `displayName`, `emoji`, `color` | string | Snapshot of the identity at send-time |
| `text` | string | Sanitized, max 2000 chars |
| `replyToId` | string \| null | Points at another message's `_id` |
| `reactions` | map | emoji → array of `temporaryUserId` |
| `createdAt` / `expiresAt` | Date | Mirrors the parent room's expiry |

Both collections have a MongoDB TTL index on `expiresAt`. The backend
does **not** rely solely on that — `backend/src/utils/cleanup.ts` runs a
sweep on an interval that closes expired rooms, disconnects sockets, and
hard-deletes messages immediately, so behavior doesn't depend on TTL
timing (which MongoDB only guarantees "eventually").

---

## 6. Production deployment

This is a two-process app (a Node/Socket.IO server and a static frontend
bundle) plus a MongoDB database — deploy them as three independent
pieces:

1. **MongoDB** — use a managed instance (e.g. MongoDB Atlas) rather than
   self-hosting for production. Put the connection string in the
   backend's `MONGODB_URI`.

2. **Backend** — deploy `backend/` to any Node host that supports
   long-lived WebSocket connections (e.g. Render, Railway, Fly.io, or a
   VM behind nginx). Steps:
   ```bash
   cd backend
   npm install
   npm run build
   npm start
   ```
   Set `NODE_ENV=production`, `MONGODB_URI`, and `CLIENT_ORIGIN` (your
   deployed frontend's URL) as environment variables on the host. If you
   put it behind a reverse proxy, make sure WebSocket upgrade headers are
   forwarded.

3. **Frontend** — deploy `frontend/` as a static build to Vercel,
   Netlify, or any static host:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   This produces `frontend/dist/`. Set `VITE_SERVER_URL` to your deployed
   backend's URL before building (Vite inlines env vars at build time).

4. Use HTTPS/WSS in production so passwords and messages aren't sent in
   the clear over the network.

---

## 7. Notes on privacy claims

The UI is written to avoid promising more than the system delivers: it
says data is deleted on expiry and that no account is required, but it
does **not** claim end-to-end encryption or absolute anonymity, since
neither is implemented in this version. If you add real E2EE later,
update the in-app copy to match — don't let the UI overstate what the
backend actually guarantees.

## GPT Build Notes
This version adds cryptographically secure room-code generation, stronger room-code entropy, server-side Socket.IO event rate limiting, cryptographically selected temporary identity components, and room-scoped duplicate identity avoidance while preserving the original BlinkChat UI.

## BlinkChat Hybrid Edition
This build combines the strongest implementation ideas from the Claude, Kimi, and GPT versions: server-side Socket.IO ownership and room-scoped authorization; Zod HTTP validation and service-layer helpers; cryptographically secure room codes and temporary identities. It also adds a short-lived anonymous reconnection session, serialized room joins to prevent same-process capacity races, per-event Socket.IO abuse limits, and safer typing timer cleanup. No permanent account or personal contact information is introduced.
