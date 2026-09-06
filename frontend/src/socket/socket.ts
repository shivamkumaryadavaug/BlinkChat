import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

let socket: Socket | null = null;

// A single lazily-created socket for the whole app session. It connects
// only once the user actually joins a room, and is fully torn down when
// they leave - no background connection is held on the landing page.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
