import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "./errorHandler";

export const createRoomSchema = z.object({
  roomName: z.string().max(60).optional(),
  expiration: z.enum(["1h","6h","24h","7d"]),
  maxParticipants: z.number().int().min(2).max(200),
  password: z.string().max(100).optional(),
});
export const checkRoomSchema = z.object({
  roomCode: z.string().min(3).max(64),
  password: z.string().max(100).optional(),
});
export function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed=schema.safeParse(req.body);
    if(!parsed.success) return next(new HttpError(400, parsed.error.issues.map(i=>i.message).join("; ")));
    req.body=parsed.data; next();
  };
}
