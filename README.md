# UVCraft

A browser-based 3D University of Victoria campus walk built with React, Vite, Three.js, and React Three Fiber.

## Local Single Player

```powershell
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## LAN Co-op

Use this when players are on the same Wi-Fi/network.

1. On the host PC, start the multiplayer server:

```powershell
npm run server
```

2. In another terminal on the same host PC, start the game for LAN access:

```powershell
npm run dev:lan
```

3. Find the host PC's local IP address:

```powershell
ipconfig
```

Look for the IPv4 address, such as `192.168.1.42`.

4. On each device, open the host PC's game URL:

```text
http://HOST_PC_IP:5173
```

Example:

```text
http://192.168.1.42:5173
```

5. In the game, enter a name and room, then press `Join`.

Players using the same room name will see each other in the campus world.

## Controls

PC:

- Click the game to enter walk mode.
- `WASD` to move.
- Mouse to look.
- `Shift` to sprint.
- `Space` to jump.
- `Esc` to release the cursor.

Phone:

- Left joystick to move.
- Drag on the right side to look.
- `Jump` button to jump.
- Push the joystick far out to sprint.

## GitHub Pages

The static single-player build is deployed by GitHub Actions to:

```text
https://prabhnoob.github.io/UVcraft/
```

LAN co-op should be run from the host PC's local `http://HOST_PC_IP:5173` URL so phones can connect back to the local multiplayer server.
