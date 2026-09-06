import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db";
import { roomRoutes } from "./routes/roomRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { registerChatSocket } from "./sockets/chatSocket";
import { startCleanupSweep } from "./utils/cleanup";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: CLIENT_ORIGINS, credentials: false }));
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", apiRateLimiter);
  app.use("/api", roomRoutes);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = http.createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: CLIENT_ORIGINS, credentials: false },
    // Keep payloads small and connections tidy - this is a lightweight
    // ephemeral chat, not a file transfer service.
    maxHttpBufferSize: 20 * 1024,
  });

  registerChatSocket(io);

  const cleanupTimer = startCleanupSweep(io, Number(process.env.CLEANUP_INTERVAL_MS ?? 60000));

  httpServer.listen(PORT, () => {
    console.log(`[server] BlinkChat backend listening on port ${PORT}`);
  });

  const shutdown = () => {
    clearInterval(cleanupTimer);
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
