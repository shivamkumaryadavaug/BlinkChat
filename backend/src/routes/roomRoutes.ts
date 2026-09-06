import { Router } from "express";
import { createRoom, checkRoom } from "../controllers/roomController";
import { validate, createRoomSchema, checkRoomSchema } from "../middleware/validator";
import { joinRateLimiter } from "../middleware/rateLimiter";

export const roomRoutes = Router();

roomRoutes.post("/rooms", createRoom);
roomRoutes.post("/rooms/check", joinRateLimiter, checkRoom);
