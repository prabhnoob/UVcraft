import { io, type Socket } from "socket.io-client";

export type RemotePlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  updatedAt: number;
};

export type MultiplayerSnapshot = {
  connected: boolean;
  connecting: boolean;
  id: string | null;
  room: string;
  players: RemotePlayer[];
  error: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
const players = new Map<string, RemotePlayer>();

let socket: Socket | null = null;
let selfId: string | null = null;
let roomId = "uvcraft";
let isConnecting = false;
let isConnected = false;
let errorMessage: string | null = null;

function getDefaultServerUrl() {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname || "localhost";
  return `${protocol}//${host}:3001`;
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function subscribeToMultiplayer(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMultiplayerSnapshot(): MultiplayerSnapshot {
  return {
    connected: isConnected,
    connecting: isConnecting,
    id: selfId,
    room: roomId,
    players: [...players.values()].filter((player) => player.id !== selfId),
    error: errorMessage,
  };
}

export function connectMultiplayer({ name, room, serverUrl }: { name: string; room: string; serverUrl?: string }) {
  socket?.disconnect();
  players.clear();
  selfId = null;
  roomId = room.trim() || "uvcraft";
  isConnecting = true;
  isConnected = false;
  errorMessage = null;
  emitChange();

  socket = io(serverUrl?.trim() || getDefaultServerUrl(), {
    transports: ["websocket"],
    timeout: 5000,
  });

  socket.on("connect", () => {
    isConnecting = false;
    isConnected = true;
    errorMessage = null;
    socket?.emit("player:join", { name, room: roomId });
    emitChange();
  });

  socket.on("connect_error", () => {
    isConnecting = false;
    isConnected = false;
    errorMessage = "Could not reach LAN server";
    emitChange();
  });

  socket.on("disconnect", () => {
    isConnecting = false;
    isConnected = false;
    emitChange();
  });

  socket.on("session", ({ id, room, players: sessionPlayers }: { id: string; room: string; players: RemotePlayer[] }) => {
    selfId = id;
    roomId = room;
    players.clear();
    for (const player of sessionPlayers) players.set(player.id, player);
    emitChange();
  });

  socket.on("player:joined", (player: RemotePlayer) => {
    players.set(player.id, player);
    emitChange();
  });

  socket.on("player:update", (player: RemotePlayer) => {
    players.set(player.id, player);
    emitChange();
  });

  socket.on("player:left", (id: string) => {
    players.delete(id);
    emitChange();
  });
}

export function disconnectMultiplayer() {
  socket?.disconnect();
  socket = null;
  players.clear();
  selfId = null;
  isConnecting = false;
  isConnected = false;
  emitChange();
}

export function sendPlayerUpdate(state: Omit<RemotePlayer, "id" | "name" | "updatedAt">) {
  if (!socket?.connected) return;
  socket.emit("player:update", state);
}
