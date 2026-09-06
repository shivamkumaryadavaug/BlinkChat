import crypto from "crypto";
import { nanoid } from "nanoid";
import { TemporaryIdentity } from "../types";

const ADJECTIVES = [
  "Silent", "Golden", "Purple", "Blue", "Rapid", "Hidden", "Lucky", "Quiet",
  "Bold", "Mellow", "Frosty", "Vivid", "Calm", "Swift", "Bright", "Curious",
];

const ANIMALS: Array<{ name: string; emoji: string }> = [
  { name: "Tiger", emoji: "🐯" },
  { name: "Fox", emoji: "🦊" },
  { name: "Eagle", emoji: "🦅" },
  { name: "Panda", emoji: "🐼" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Otter", emoji: "🦦" },
  { name: "Falcon", emoji: "🦅" },
  { name: "Koala", emoji: "🐨" },
  { name: "Owl", emoji: "🦉" },
  { name: "Dolphin", emoji: "🐬" },
  { name: "Lynx", emoji: "🐆" },
  { name: "Raven", emoji: "🐦‍⬛" },
];

const AVATAR_COLORS = [
  "#8B7FFF", "#4FE3C1", "#FFB86B", "#FF6FA5", "#5EA1FF", "#B4F461",
];

/**
 * Builds a fresh, room-scoped identity. Nothing here is derived from any
 * account or device fingerprint - it's pure randomness, generated new
 * every time someone joins a room.
 */
export function generateTemporaryIdentity(): TemporaryIdentity {
  const adjective = ADJECTIVES[crypto.randomInt(ADJECTIVES.length)];
  const animal = ANIMALS[crypto.randomInt(ANIMALS.length)];
  const color = AVATAR_COLORS[crypto.randomInt(AVATAR_COLORS.length)];

  return {
    temporaryUserId: nanoid(16),
    displayName: `${adjective} ${animal.name}`,
    emoji: animal.emoji,
    color,
  };
}
