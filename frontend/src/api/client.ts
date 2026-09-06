import { ExpirationOption, RoomSummary } from "../types";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export async function createRoom(input: {
  roomName?: string;
  expiration: ExpirationOption;
  maxParticipants: number;
  password?: string;
}): Promise<RoomSummary> {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<RoomSummary>(res);
}

export async function checkRoom(input: { roomCode: string; password?: string }): Promise<RoomSummary> {
  const res = await fetch(`${BASE_URL}/api/rooms/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<RoomSummary>(res);
}
