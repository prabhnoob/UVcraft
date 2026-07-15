import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT ?? 3001);
const STALE_PLAYER_MS = 15000;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function sanitizeName(name) {
  const trimmed = String(name ?? "").trim().slice(0, 18);
  return trimmed || "Visitor";
}

function sanitizeRoom(room) {
  const trimmed = String(room ?? "").trim().slice(0, 18);
  return trimmed || "uvcraft";
}

function playersFor(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room.values()];
}

function removePlayer(socket) {
  const { roomId } = socket.data;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(socket.id);
  socket.to(roomId).emit("player:left", socket.id);
  if (room.size === 0) rooms.delete(roomId);
}

io.on("connection", (socket) => {
  socket.on("player:join", ({ name, room }) => {
    removePlayer(socket);

    const roomId = sanitizeRoom(room);
    const player = {
      id: socket.id,
      name: sanitizeName(name),
      x: 72,
      y: 4,
      z: 122,
      yaw: 0,
      pitch: 0,
      updatedAt: Date.now(),
    };

    socket.data.roomId = roomId;
    socket.join(roomId);
    getRoom(roomId).set(socket.id, player);
    socket.emit("session", { id: socket.id, room: roomId, players: playersFor(roomId) });
    socket.to(roomId).emit("player:joined", player);
  });

  socket.on("player:update", (state) => {
    const { roomId } = socket.data;
    if (!roomId) return;

    const room = rooms.get(roomId);
    const player = room?.get(socket.id);
    if (!player) return;

    player.x = Number(state?.x) || 0;
    player.y = Number(state?.y) || 0;
    player.z = Number(state?.z) || 0;
    player.yaw = Number(state?.yaw) || 0;
    player.pitch = Number(state?.pitch) || 0;
    player.updatedAt = Date.now();
    socket.to(roomId).emit("player:update", player);
  });

  socket.on("disconnect", () => {
    removePlayer(socket);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    for (const [id, player] of room) {
      if (now - player.updatedAt > STALE_PLAYER_MS) {
        room.delete(id);
        io.to(roomId).emit("player:left", id);
      }
    }
    if (room.size === 0) rooms.delete(roomId);
  }
}, 5000);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`UVCraft LAN server listening on http://0.0.0.0:${PORT}`);
});
