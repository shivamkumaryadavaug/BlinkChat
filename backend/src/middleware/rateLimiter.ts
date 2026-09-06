import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 60);

export const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

// Tighter limiter specifically for room join attempts, to slow down
// brute-forcing of room codes / passwords.
export const joinRateLimiter = rateLimit({
  windowMs: 60000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many join attempts. Please wait a moment before trying again." },
});
