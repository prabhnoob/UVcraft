import { BUILDINGS, buildingPosition, buildingRotation } from "./geo";
import { Text } from "@react-three/drei";
import { terrainHeight } from "./terrain";
import {
  Building,
  BuildingBlock,
  Box,
  Canopy,
  Chimney,
  Cyl,
  Dome,
  PitchedRoof,
  Slab,
  TotemPole,
} from "./primitives";
import type { ReactElement } from "react";
import type { BuildingDef } from "./geo";
import type { V3 } from "./primitives";

function byName(name: string) {
  const building = BUILDINGS.find((b) => b.name === name);
  if (!building) throw new Error(`Missing building definition: ${name}`);
  return building;
}

function at(building: BuildingDef) {
  const [x, z] = buildingPosition(building);
  return { x, z };
}

function groundY(x: number, z: number) {
  return terrainHeight(x, z) + 0.08;
}

function EntranceMarker({ building }: { building: BuildingDef }) {
  const doorW = Math.min(9, building.fw * 0.22);
  const signW = Math.min(12, building.fw * 0.34);
  const frontZ = building.fd / 2 + 0.1;
  const doorH = Math.min(3, building.flH * 0.72);
  return (
    <group>
      <Box pos={[0, doorH / 2, frontZ] as V3} size={[doorW, doorH, 0.18]} color={building.winColor} opacity={0.82} roughness={0.2} metalness={0.16} />
      <Box pos={[0, doorH + 0.35, frontZ + 0.72] as V3} size={[signW, 0.28, 1.35]} color="#37352d" roughness={0.58} />
      <Box pos={[-doorW / 2 - 0.7, 1.3, frontZ] as V3} size={[0.28, 2.6, 0.2]} color="#d8d2b7" roughness={0.45} />
      <Box pos={[doorW / 2 + 0.7, 1.3, frontZ] as V3} size={[0.28, 2.6, 0.2]} color="#d8d2b7" roughness={0.45} />
      <Text position={[0, doorH + 0.95, frontZ + 0.84]} fontSize={0.82} color="#f4edc8" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#1b1d16">
        {building.abbr}
      </Text>
    </group>
  );
}

function StandardBuilding({ building }: { building: BuildingDef }) {
  const { x, z } = at(building);
  return (
    <group position={[x, groundY(x, z), z]} rotation={[0, buildingRotation(building), 0]}>
      <Box pos={[0, 0.035, 0] as V3} size={[building.fw + 3.2, 0.14, building.fd + 3.2]} color="#4f5141" roughness={0.86} />
      <Building
        name={building.name}
        x={0}
        z={0}
        w={building.fw}
        d={building.fd}
        floors={building.floors}
        floorHeight={building.flH}
        color={building.color}
        roofColor={building.roofColor}
        glassColor={building.winColor}
      />
      <EntranceMarker building={building} />
    </group>
  );
}

function RoomZone({
  x,
  z,
  y,
  w,
  d,
  color,
  opacity = 0.72,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  color: string;
  opacity?: number;
}) {
  return <Box pos={[x, y, z] as V3} size={[w, 0.1, d]} color={color} opacity={opacity} roughness={0.7} />;
}

function BookStacks({
  x,
  z,
  y,
  rows,
  length,
  gap = 1.7,
  axis = "x",
}: {
  x: number;
  z: number;
  y: number;
  rows: number;
  length: number;
  gap?: number;
  axis?: "x" | "z";
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => {
        const offset = (i - (rows - 1) / 2) * gap;
        const px = axis === "x" ? x : x + offset;
        const pz = axis === "x" ? z + offset : z;
        const size = (axis === "x" ? [length, 1.08, 0.36] : [0.36, 1.08, length]) as V3;
        const capSize = (axis === "x" ? [length + 0.3, 0.08, 0.52] : [0.52, 0.08, length + 0.3]) as V3;
        return (
          <group key={`${axis}-${i}`}>
            <Box pos={[px, y + 0.62, pz] as V3} size={size} color={i % 3 === 0 ? "#6f8a64" : "#78966c"} roughness={0.88} />
            <Box pos={[px, y + 1.2, pz] as V3} size={capSize} color="#d8d5bd" roughness={0.8} />
          </group>
        );
      })}
    </>
  );
}

function StudyTables({
  x,
  z,
  y,
  cols,
  rows,
  spacingX = 5,
  spacingZ = 3,
  color = "#b28c5c",
}: {
  x: number;
  z: number;
  y: number;
  cols: number;
  rows: number;
  spacingX?: number;
  spacingZ?: number;
  color?: string;
}) {
  const tables = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = x + (col - (cols - 1) / 2) * spacingX;
      const pz = z + (row - (rows - 1) / 2) * spacingZ;
      tables.push(
        <group key={`${row}-${col}`}>
          <Box pos={[px, y + 0.42, pz] as V3} size={[3.0, 0.16, 1.2]} color={color} roughness={0.55} />
          <Box pos={[px - 1.05, y + 0.22, pz - 0.95] as V3} size={[0.55, 0.42, 0.45]} color="#384248" roughness={0.65} />
          <Box pos={[px + 1.05, y + 0.22, pz + 0.95] as V3} size={[0.55, 0.42, 0.45]} color="#384248" roughness={0.65} />
        </group>,
      );
    }
  }
  return <>{tables}</>;
}

function ComputerBank({
  x,
  z,
  y,
  count,
  length,
  axis = "x",
}: {
  x: number;
  z: number;
  y: number;
  count: number;
  length: number;
  axis?: "x" | "z";
}) {
  const monitors = [];
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * (length / count);
    monitors.push(
      <group key={i}>
        <Box
          pos={[axis === "x" ? x + offset : x - 0.28, y + 0.72, axis === "x" ? z - 0.28 : z + offset] as V3}
          size={(axis === "x" ? [0.72, 0.48, 0.08] : [0.08, 0.48, 0.72]) as V3}
          color="#1b3244"
          metalness={0.18}
          roughness={0.18}
        />
        <Box
          pos={[axis === "x" ? x + offset : x + 0.28, y + 0.72, axis === "x" ? z + 0.28 : z + offset] as V3}
          size={(axis === "x" ? [0.72, 0.48, 0.08] : [0.08, 0.48, 0.72]) as V3}
          color="#243f54"
          metalness={0.18}
          roughness={0.18}
        />
      </group>,
    );
  }
  return (
    <group>
      <Box pos={[x, y + 0.38, z] as V3} size={(axis === "x" ? [length, 0.16, 1.1] : [1.1, 0.16, length]) as V3} color="#c6b184" roughness={0.58} />
      {monitors}
    </group>
  );
}

function GlassRooms({
  x,
  z,
  y,
  rooms,
  roomW,
  roomD,
  axis = "x",
}: {
  x: number;
  z: number;
  y: number;
  rooms: number;
  roomW: number;
  roomD: number;
  axis?: "x" | "z";
}) {
  return (
    <>
      {Array.from({ length: rooms }).map((_, i) => {
        const offset = (i - (rooms - 1) / 2) * (axis === "x" ? roomW + 0.3 : roomD + 0.3);
        const px = axis === "x" ? x + offset : x;
        const pz = axis === "x" ? z : z + offset;
        return (
          <group key={i}>
            <RoomZone x={px} z={pz} y={y + 0.03} w={roomW} d={roomD} color="#d5c1dc" opacity={0.78} />
            <Box pos={[px, y + 0.95, pz - roomD / 2] as V3} size={[roomW, 1.8, 0.08]} color="#a8d7e7" opacity={0.36} roughness={0.08} />
            <Box pos={[px, y + 0.95, pz + roomD / 2] as V3} size={[roomW, 1.8, 0.08]} color="#a8d7e7" opacity={0.36} roughness={0.08} />
            <Box pos={[px - roomW / 2, y + 0.95, pz] as V3} size={[0.08, 1.8, roomD]} color="#a8d7e7" opacity={0.36} roughness={0.08} />
            <Box pos={[px + roomW / 2, y + 0.95, pz] as V3} size={[0.08, 1.8, roomD]} color="#a8d7e7" opacity={0.36} roughness={0.08} />
            <StudyTables x={px} z={pz} y={y} cols={1} rows={1} color="#b98d66" />
          </group>
        );
      })}
    </>
  );
}

function StairCore({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group>
      <Box pos={[x, h / 2, z] as V3} size={[5.4, h, 4.6]} color="#e0ded1" opacity={0.38} roughness={0.55} />
      {Array.from({ length: 18 }).map((_, i) => (
        <Box
          key={i}
          pos={[x - 1.6 + (i % 6) * 0.62, 0.5 + i * 0.85, z + (i % 2 === 0 ? -0.85 : 0.85)] as V3}
          size={[1.0, 0.08, 1.4]}
          color="#8b897f"
          roughness={0.7}
        />
      ))}
    </group>
  );
}

function ElevatorCore({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group>
      <Box pos={[x, h / 2, z] as V3} size={[3.2, h, 3.2]} color="#35393d" opacity={0.76} roughness={0.48} />
      {[0.65, 4.85, 9.05, 13.25].map((y, i) => (
        <Box key={i} pos={[x, y, z + 1.66] as V3} size={[1.8, 1.15, 0.08]} color="#c02086" roughness={0.35} />
      ))}
    </group>
  );
}

function LibraryShell({ w, d, h, color, roofColor }: { w: number; d: number; h: number; color: string; roofColor: string }) {
  const wall = 0.34;
  const finCount = 12;
  const upperY = h * 0.52;
  const upperH = h * 0.55;
  return (
    <group>
      <Box pos={[0, h / 2, 0] as V3} size={[w, h, d]} color="#bcb28f" roughness={0.88} />
      <Box pos={[0, 2.25, d / 2 + 0.06] as V3} size={[w - 3.5, 3.7, 0.16]} color="#182838" roughness={0.18} metalness={0.12} />
      <Box pos={[0, 2.25, -d / 2 - 0.06] as V3} size={[w - 3.5, 3.4, 0.16]} color="#172637" roughness={0.18} metalness={0.12} />
      <Box pos={[-w / 2 - 0.06, 2.5, -2] as V3} size={[0.16, 3.8, d - 8]} color="#172637" roughness={0.18} metalness={0.12} />
      <Box pos={[w / 2 + 0.06, 2.5, 0] as V3} size={[0.16, 3.8, d - 6]} color="#172637" roughness={0.18} metalness={0.12} />
      <Box pos={[0, upperY, d / 2 + wall / 2] as V3} size={[w, upperH, wall]} color={color} roughness={0.9} />
      <Box pos={[0, upperY, -d / 2 - wall / 2] as V3} size={[w, upperH, wall]} color="#a99f7f" roughness={0.9} />
      <Box pos={[-w / 2 - wall / 2, h / 2, -2.5] as V3} size={[wall, h, d - 10]} color="#aca382" roughness={0.9} />
      <Box pos={[w / 2 + wall / 2, h / 2, 0] as V3} size={[wall, h, d]} color="#aaa07f" roughness={0.9} />
      <Box pos={[0, h + 0.1, -d / 2 + 1.4] as V3} size={[w + 3.2, 0.34, 3.2]} color={roofColor} roughness={0.62} />
      <Box pos={[-w / 2 + 1.5, h + 0.1, 0] as V3} size={[3.0, 0.34, d + 3.2]} color={roofColor} roughness={0.62} />
      <Box pos={[w / 2 - 1.5, h + 0.1, 0] as V3} size={[3.0, 0.34, d + 3.2]} color={roofColor} roughness={0.62} />
      <Box pos={[0, h + 0.1, d / 2 - 1.5] as V3} size={[w + 3.2, 0.34, 3.0]} color={roofColor} roughness={0.62} />
      <Box pos={[0, h + 0.42, 0] as V3} size={[w + 1.6, 0.18, d + 1.6]} color="#514d43" roughness={0.78} />
      {Array.from({ length: finCount }).map((_, i) => {
        const px = -w * 0.43 + (w * 0.86 * i) / Math.max(1, finCount - 1);
        return (
          <group key={i}>
            <Box pos={[px, upperY, d / 2 + 0.48] as V3} size={[0.55, upperH + 0.6, 0.72]} color="#d5d0be" roughness={0.76} />
            <Box pos={[px, upperY, -d / 2 - 0.46] as V3} size={[0.48, upperH, 0.62]} color="#c8c2ad" roughness={0.78} />
          </group>
        );
      })}
      {[-0.36, -0.18, 0, 0.18, 0.36].map((offset, i) => (
        <Box key={i} pos={[offset * w, h * 0.62, d / 2 + 0.86] as V3} size={[3.0, h * 0.48, 0.22]} color="#eceae0" roughness={0.7} />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box pos={[side * 17, 0.16, d / 2 + 4.5] as V3} size={[18, 0.12, 5.8]} color="#b7a686" roughness={0.78} />
          <Box pos={[side * 17, 2.25, d / 2 + 2.45] as V3} size={[17, 0.2, 5.6]} color="#6c6250" roughness={0.42} metalness={0.14} />
        </group>
      ))}
    </group>
  );
}

function MearnsGlassWing({ x, z, w, d, h }: { x: number; z: number; w: number; d: number; h: number }) {
  return (
    <group>
      <Box pos={[x, h / 2, z - d / 2] as V3} size={[w, h, 0.22]} color="#2e4651" roughness={0.18} metalness={0.18} />
      <Box pos={[x, h / 2, z + d / 2] as V3} size={[w, h, 0.22]} color="#344d58" roughness={0.18} metalness={0.18} />
      <Box pos={[x - w / 2, h / 2, z] as V3} size={[0.22, h, d]} color="#2c424d" roughness={0.18} metalness={0.18} />
      <Box pos={[x + w / 2, h / 2, z] as V3} size={[0.22, h, d]} color="#344b56" roughness={0.18} metalness={0.18} />
      {[0.2, 4.4, 8.6, 12.8].map((fy, i) => (
        <Box key={i} pos={[x, fy, z] as V3} size={[w, 0.16, d]} color="#d8d2bc" roughness={0.62} />
      ))}
      {[-0.36, -0.12, 0.12, 0.36].map((offset) => (
        <Box key={offset} pos={[x + offset * w, h / 2, z + d / 2 + 0.18] as V3} size={[0.2, h, 0.34]} color="#4d5b60" roughness={0.28} metalness={0.25} />
      ))}
      <Box pos={[x, h + 0.45, z] as V3} size={[w + 1.0, 0.24, d + 1.0]} color="#6f7f82" roughness={0.28} metalness={0.2} />
    </group>
  );
}

function CafeCounter({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <group>
      <Box pos={[x, y + 0.5, z] as V3} size={[9.5, 1.0, 1.25]} color="#704a2b" roughness={0.55} />
      <Box pos={[x - 2.4, y + 1.16, z - 0.2] as V3} size={[1.0, 0.26, 0.9]} color="#1f2528" roughness={0.28} metalness={0.2} />
      <Box pos={[x + 2.2, y + 1.16, z - 0.2] as V3} size={[1.0, 0.26, 0.9]} color="#1f2528" roughness={0.28} metalness={0.2} />
      <StudyTables x={x - 1} z={z + 4.1} y={y} cols={2} rows={2} spacingX={4.2} spacingZ={2.8} color="#8f6942" />
    </group>
  );
}

function AskUsDesk({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <group>
      <mesh position={[x, y + 0.43, z]} scale={[1.75, 1, 0.95]} castShadow receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.86, 28]} />
        <meshStandardMaterial color="#efe8a6" roughness={0.52} />
      </mesh>
      <Box pos={[x, y + 1.03, z - 0.08] as V3} size={[2.7, 0.08, 0.7]} color="#fff6c4" roughness={0.45} />
      <Box pos={[x, y + 1.48, z + 0.35] as V3} size={[1.65, 0.68, 0.08]} color="#2b4354" roughness={0.2} metalness={0.15} />
    </group>
  );
}

function LibraryInterior({ w, d, h }: { w: number; d: number; h: number }) {
  const lower = 0.22;
  const main = 4.42;
  const second = 8.62;
  const third = 12.82;
  const fourth = 16.05;
  return (
    <group>
      {[lower, main, second, third].map((y) => (
        <Box key={y} pos={[0, y, 0] as V3} size={[w - 1.2, 0.16, d - 1.2]} color="#d9d0b4" opacity={0.68} roughness={0.62} />
      ))}

      <RoomZone x={-21} z={8} y={lower + 0.12} w={20} d={25} color="#e4eadc" opacity={0.8} />
      <BookStacks x={-21} z={8} y={lower} rows={12} length={18} />
      <RoomZone x={-18} z={-15} y={lower + 0.12} w={16} d={13} color="#d7bdd8" opacity={0.82} />
      <RoomZone x={2} z={0} y={lower + 0.12} w={30} d={7} color="#d9e7f5" opacity={0.74} />
      <RoomZone x={5} z={-13} y={lower + 0.12} w={17} d={11} color="#d9e7f5" opacity={0.74} />
      <RoomZone x={22} z={-10} y={lower + 0.12} w={15} d={18} color="#f2e5a6" opacity={0.86} />
      <RoomZone x={20} z={11} y={lower + 0.12} w={23} d={8} color="#f5efab" opacity={0.9} />
      <StudyTables x={4} z={-13} y={lower} cols={2} rows={2} />
      <GlassRooms x={14} z={-19} y={lower} rooms={3} roomW={4.0} roomD={3.8} />
      <StairCore x={-27} z={-17} h={h} />
      <StairCore x={26} z={-17} h={h} />
      <StairCore x={-5} z={21} h={h} />
      <ElevatorCore x={-6} z={6} h={h} />
      <ElevatorCore x={20} z={-18} h={h} />

      <RoomZone x={-23} z={-15} y={main + 0.12} w={18} d={12} color="#f3e7ba" opacity={0.85} />
      <CafeCounter x={-23} z={-17} y={main} />
      <AskUsDesk x={-8} z={8} y={main} />
      <RoomZone x={2} z={-2} y={main + 0.12} w={25} d={14} color="#d9e7f5" opacity={0.74} />
      <ComputerBank x={2} z={-2} y={main} count={8} length={20} />
      <ComputerBank x={2} z={3} y={main} count={6} length={16} />
      <RoomZone x={21} z={13} y={main + 0.12} w={15} d={16} color="#f0dca4" opacity={0.86} />
      <StudyTables x={20} z={13} y={main} cols={2} rows={3} color="#be9160" />
      <GlassRooms x={-20} z={-1} y={main} rooms={4} roomW={4.2} roomD={4.1} />
      <GlassRooms x={-6} z={20} y={main} rooms={4} roomW={3.4} roomD={3.2} />
      <RoomZone x={20} z={-3} y={main + 0.12} w={20} d={9} color="#e6eddc" opacity={0.8} />
      <BookStacks x={20} z={-3} y={main} rows={5} length={17} />
      <RoomZone x={-23} z={15} y={main + 0.12} w={14} d={12} color="#d9e7f5" opacity={0.76} />
      <StudyTables x={-23} z={15} y={main} cols={2} rows={2} />

      <RoomZone x={-18} z={0} y={second + 0.12} w={27} d={35} color="#e6eddc" opacity={0.82} />
      <BookStacks x={-18} z={0} y={second} rows={14} length={24} />
      <RoomZone x={15} z={-1} y={second + 0.12} w={25} d={34} color="#e6eddc" opacity={0.82} />
      <BookStacks x={15} z={-1} y={second} rows={13} length={22} />
      <RoomZone x={-1} z={16} y={second + 0.12} w={12} d={8} color="#d9e7f5" opacity={0.74} />
      <StudyTables x={-1} z={16} y={second} cols={2} rows={2} />
      <GlassRooms x={21} z={17} y={second} rooms={4} roomW={3.6} roomD={3.6} />
      <ComputerBank x={-1} z={-18} y={second} count={5} length={12} />

      <RoomZone x={-19} z={0} y={third + 0.12} w={28} d={38} color="#e6eddc" opacity={0.82} />
      <BookStacks x={-19} z={0} y={third} rows={16} length={26} />
      <RoomZone x={15} z={0} y={third + 0.12} w={25} d={34} color="#e6eddc" opacity={0.82} />
      <BookStacks x={15} z={0} y={third} rows={12} length={22} />
      <RoomZone x={-1} z={-11} y={third + 0.12} w={13} d={15} color="#d9e7f5" opacity={0.78} />
      <StudyTables x={-1} z={-11} y={third} cols={2} rows={3} color="#a97954" />
      <RoomZone x={22} z={-14} y={third + 0.12} w={7} d={12} color="#d9e7f5" opacity={0.78} />
      <StudyTables x={22} z={-14} y={third} cols={1} rows={3} color="#a97954" />
      <GlassRooms x={-5} z={-21} y={third} rooms={6} roomW={3.0} roomD={3.0} />

      <Box pos={[10, fourth, -4] as V3} size={[24, 0.14, 18]} color="#cfc7ac" opacity={0.62} roughness={0.6} />
      <GlassRooms x={10} z={-4} y={fourth} rooms={5} roomW={4.0} roomD={4.2} />
    </group>
  );
}

function MearnsInterior({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const main = 4.42;
  const second = 8.62;
  const third = 12.82;
  return (
    <group>
      <GlassRooms x={x - 5} z={z + 6} y={main} rooms={3} roomW={5.0} roomD={4.0} />
      <RoomZone x={x + 6} z={z + 5} y={main + 0.12} w={12} d={8} color="#d9e7f5" opacity={0.76} />
      <StudyTables x={x + 6} z={z + 5} y={main} cols={2} rows={2} />
      <ComputerBank x={x + 2} z={z - 7} y={main} count={6} length={16} />
      <RoomZone x={x - 6} z={z - 7} y={second + 0.12} w={14} d={10} color="#d7bdd8" opacity={0.82} />
      <GlassRooms x={x + 6} z={z - 7} y={second} rooms={4} roomW={3.8} roomD={3.4} />
      <StudyTables x={x - 7} z={z + 5} y={second} cols={2} rows={3} />
      <RoomZone x={x - 4} z={z - 3} y={third + 0.12} w={18} d={16} color="#f5efab" opacity={0.9} />
      <ComputerBank x={x - 6} z={z - 4} y={third} count={5} length={12} />
      <StudyTables x={x + 4} z={z + 3} y={third} cols={2} rows={2} color="#be9160" />
      <GlassRooms x={x + w / 2 - 4} z={z} y={third} rooms={3} roomW={3.8} roomD={4.2} axis="z" />
      <StairCore x={x + w / 2 - 1.8} z={z + d / 2 - 2} h={13.0} />
    </group>
  );
}

function Library() {
  const lib = byName("McPherson Library");
  const mearns = byName("Mearns Centre (Library wing)");
  const { x, z } = at(lib);
  const m = at(mearns);
  const h = lib.floors * lib.flH;
  const mx = m.x - x;
  const mz = m.z - z;
  const mearnsH = mearns.floors * mearns.flH;
  const bridgeW = mx - mearns.fw / 2 - lib.fw / 2;
  const bridgeX = lib.fw / 2 + bridgeW / 2;
  return (
    <group name="McPherson Library">
      <group position={[x, groundY(x, z), z]}>
        <LibraryShell w={lib.fw} d={lib.fd} h={h} color={lib.color} roofColor={lib.roofColor} />
        <LibraryInterior w={lib.fw} d={lib.fd} h={h} />
        <MearnsGlassWing x={mx} z={mz} w={mearns.fw} d={mearns.fd} h={mearnsH} />
        <MearnsInterior x={mx} z={mz} w={mearns.fw} d={mearns.fd} />
        {bridgeW > 2 && (
          <group>
            <Box pos={[bridgeX, 6.4, mz + 8] as V3} size={[bridgeW, 4.8, 8.0]} color="#344d58" roughness={0.16} metalness={0.16} />
            <Box pos={[bridgeX, 8.82, mz + 8] as V3} size={[bridgeW + 0.8, 0.18, 8.8]} color="#7f8378" roughness={0.35} />
            <Box pos={[bridgeX, 4.15, mz + 8] as V3} size={[bridgeW + 0.8, 0.18, 8.8]} color="#cfc7ac" roughness={0.58} />
          </group>
        )}
        <Box pos={[-22, 0.09, lib.fd / 2 + 7] as V3} size={[25, 0.12, 11]} color="#c9bd98" roughness={0.88} />
        <Box pos={[-22, 1.8, lib.fd / 2 + 2.7] as V3} size={[15, 0.18, 5.6]} color="#5f5a50" roughness={0.35} metalness={0.18} />
        <Box pos={[-25.8, 1.0, lib.fd / 2 + 0.55] as V3} size={[2.8, 2.0, 0.12]} color="#2d4652" roughness={0.12} metalness={0.15} />
        <Box pos={[-18.2, 1.0, lib.fd / 2 + 0.55] as V3} size={[2.8, 2.0, 0.12]} color="#2d4652" roughness={0.12} metalness={0.15} />
        <Box pos={[-22, 2.95, lib.fd / 2 + 0.68] as V3} size={[17, 0.22, 0.32]} color="#3b3528" roughness={0.56} />
        <Text position={[-22, 3.25, lib.fd / 2 + 0.88]} fontSize={1.0} color="#f5edca" anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#191a13">
          MCPHERSON LIBRARY
        </Text>
      </group>
    </group>
  );
}

function Clearihue() {
  const names = ["Clearihue Bldg — North wing", "Clearihue Bldg — South wing", "Clearihue Bldg — West wing"];
  const defs = names.map(byName);
  const north = at(defs[0]);
  const south = at(defs[1]);
  return (
    <group name="Clearihue Building">
      {defs.map((building) => {
        const { x, z } = at(building);
        const y = groundY(x, z);
        return (
          <group key={building.name}>
            <StandardBuilding building={building} />
            {Array.from({ length: Math.max(3, Math.floor(building.fw / 11)) }).map((_, i, arr) => (
              <Box
                key={i}
                pos={[
                  x - building.fw * 0.42 + (building.fw * 0.84 * i) / Math.max(1, arr.length - 1),
                  y + building.floors * building.flH * 0.5,
                  z + building.fd / 2 + 0.22,
                ] as V3}
                size={[0.55, building.floors * building.flH, 0.38]}
                color="#95896c"
              />
            ))}
          </group>
        );
      })}
      <Slab
        pos={[(north.x + south.x) / 2, groundY((north.x + south.x) / 2, (north.z + south.z) / 2) + 0.04, (north.z + south.z) / 2] as V3}
        w={48}
        d={24}
        color="#c9bd98"
        h={0.12}
      />
    </group>
  );
}

function DavidTurpin() {
  const building = byName("David Turpin Bldg");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="David Turpin Building">
      <StandardBuilding building={building} />
      <Slab pos={[x, baseY + h + 0.34, z] as V3} w={building.fw} d={building.fd} color="#3a7840" h={0.3} />
      <Box pos={[x + 21, baseY + building.flH * 1.6, z - building.fd / 2 - 0.2] as V3} size={[14, building.flH * 2.6, 0.4]} color="#b0d0c0" opacity={0.55} />
    </group>
  );
}

function Elliott() {
  const building = byName("Elliott Bldg");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="Elliott + Climenhaga Observatory">
      <StandardBuilding building={building} />
      <Dome x={x + 16} z={z - 8} y={baseY + h + 6.2} r={6.5} color="#e8e8e8" />
      <Box pos={[x + 16, baseY + h + 8.5, z - 1.8] as V3} size={[2.3, 5.5, 1.1]} color="#1a1a1a" />
    </group>
  );
}

function Engineering() {
  const names = ["Engineering ECS", "Engineering EOW", "Engineering ELW"];
  const defs = names.map(byName);
  const ecs = at(defs[0]);
  const baseY = groundY(ecs.x, ecs.z);
  return (
    <group name="Engineering Cluster">
      {defs.map((building) => <StandardBuilding key={building.name} building={building} />)}
      <Canopy x={ecs.x + 6} z={ecs.z + 16} y={baseY + defs[0].floors * defs[0].flH + 1.0} w={42} d={12} color="#2a2a2a" tilt={-0.2} />
      <Box pos={[ecs.x - 18, baseY + 8.5, ecs.z + 28] as V3} size={[18, 17, 0.45]} color="#8fd0e8" opacity={0.48} />
    </group>
  );
}

function BobWright() {
  const building = byName("Bob Wright Centre");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="Bob Wright Centre">
      <StandardBuilding building={building} />
      <Box pos={[x, baseY + building.flH * 1.2, z + building.fd / 2 + 0.2] as V3} size={[28, building.flH * 2.2, 0.45]} color="#b0d8e8" opacity={0.58} />
      <Dome x={x + 17} z={z - 9} y={baseY + h + 5.2} r={7.5} color="#a0a0a0" />
    </group>
  );
}

function CARSA() {
  const carsa = byName("CARSA");
  const parkade = byName("CARSA Parkade");
  const { x, z } = at(carsa);
  const baseY = groundY(x, z);
  return (
    <group name="CARSA">
      <StandardBuilding building={carsa} />
      <StandardBuilding building={parkade} />
      <Box pos={[x, baseY + carsa.flH, z + carsa.fd / 2 + 0.2] as V3} size={[60, carsa.flH * 1.4, 0.5]} color="#40a0be" opacity={0.55} />
      <group position={[0, groundY(x + 34, z - 18), 0]}>
        <BuildingBlock x={x + 34} z={z - 18} w={14} d={14} h={16} color="#2a2a2a" roofColor="#181818" />
      </group>
    </group>
  );
}

function JamieCassels() {
  const building = byName("Jamie Cassels Centre");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="Jamie Cassels Centre">
      <StandardBuilding building={building} />
      <Box pos={[x, baseY + h + 2.3, z] as V3} size={[building.fw + 0.6, 4.4, building.fd + 0.6]} color="#4a8060" metalness={0.25} />
    </group>
  );
}

function StudentUnion() {
  const building = byName("Student Union Bldg");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="Student Union Building">
      <StandardBuilding building={building} />
      <Box pos={[x, baseY + h + 0.45, z] as V3} size={[building.fw + 4, 0.7, building.fd + 4]} color="#9a7035" />
      <Box pos={[x, baseY + h - 0.5, z + building.fd / 2 + 0.2] as V3} size={[building.fw - 2, 0.7, 0.4]} color="#d0e8f0" opacity={0.65} />
    </group>
  );
}

function FirstPeoplesHouse() {
  const building = byName("First Peoples House");
  const { x, z } = at(building);
  const h = building.floors * building.flH;
  return (
    <group name="First Peoples House" position={[0, groundY(x, z), 0]}>
      <BuildingBlock x={x} z={z} w={building.fw} d={building.fd} h={h} color={building.color} roofColor={building.roofColor} />
      <PitchedRoof x={x} z={z} y={h} w={building.fw + 4} d={building.fd + 4} h={6} color="#5a3018" />
      <TotemPole x={x - building.fw / 2 - 4} z={z + building.fd / 2} h={10} />
    </group>
  );
}

function Phoenix() {
  const building = byName("Phoenix Theatre");
  const { x, z } = at(building);
  return (
    <group name="Phoenix Theatre">
      <StandardBuilding building={building} />
      <group position={[0, groundY(x, z - 4), 0]}>
        <BuildingBlock x={x} z={z - 4} w={20} d={18} h={building.flH * 3.6} color="#706060" roofColor="#504050" />
      </group>
    </group>
  );
}

function Residences() {
  const names = ["Čeqʷəŋín (Cheko'nien) House", "Sŋéqə (Sngequ) House"];
  return (
    <group name="Residence Towers">
      {names.map((name) => {
        const building = byName(name);
        const { x, z } = at(building);
        const baseY = groundY(x, z);
        const h = building.floors * building.flH;
        return (
          <group key={name}>
            <StandardBuilding building={building} />
            <group position={[0, baseY, 0]}>
              <BuildingBlock x={x} z={z} w={15} d={10} h={3.4} color="#405060" roofColor="#303840" />
            </group>
            <Box pos={[x, baseY + h * 0.52, z + building.fd / 2 + 0.12] as V3} size={[building.fw - 4, h * 0.86, 0.36]} color="#2a4a6a" opacity={0.48} />
          </group>
        );
      })}
    </group>
  );
}

function McKinnon() {
  const building = byName("McKinnon Bldg");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  const h = building.floors * building.flH;
  return (
    <group name="McKinnon Building">
      <StandardBuilding building={building} />
      <mesh position={[x - 10, baseY + h + 4, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[18, 18, 36, 16, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#606060" roughness={0.72} side={2} />
      </mesh>
    </group>
  );
}

function IanStewart() {
  const building = byName("Ian Stewart Complex");
  const { x, z } = at(building);
  const baseY = groundY(x, z);
  return (
    <group name="Ian Stewart Complex">
      <StandardBuilding building={building} />
      <Box pos={[x, baseY + building.floors * building.flH + 2.2, z] as V3} size={[building.fw + 3, 4.4, building.fd + 3]} color="#708090" />
    </group>
  );
}

function DistrictEnergy() {
  const building = byName("District Energy Plant");
  const { x, z } = at(building);
  return (
    <group name="District Energy Plant">
      <StandardBuilding building={building} />
      <group position={[0, groundY(x, z), 0]}>
        <Chimney x={x - 8} z={z + 6} h={15} r={1.5} />
        <Chimney x={x + 8} z={z + 6} h={15} r={1.5} />
      </group>
    </group>
  );
}

const SPECIAL_RENDERERS = new Map<string, () => ReactElement>(
[
  ["McPherson Library", Library],
  ["Mearns Centre (Library wing)", () => <></>],
  ["Clearihue Bldg — North wing", Clearihue],
  ["Clearihue Bldg — South wing", () => <></>],
  ["Clearihue Bldg — West wing", () => <></>],
  ["David Turpin Bldg", DavidTurpin],
  ["Elliott Bldg", Elliott],
  ["Engineering ECS", Engineering],
  ["Engineering EOW", () => <></>],
  ["Engineering ELW", () => <></>],
  ["Bob Wright Centre", BobWright],
  ["CARSA", CARSA],
  ["CARSA Parkade", () => <></>],
  ["Jamie Cassels Centre", JamieCassels],
  ["Student Union Bldg", StudentUnion],
  ["First Peoples House", FirstPeoplesHouse],
  ["Phoenix Theatre", Phoenix],
  ["Čeqʷəŋín (Cheko'nien) House", Residences],
  ["Sŋéqə (Sngequ) House", () => <></>],
  ["McKinnon Bldg", McKinnon],
  ["Ian Stewart Complex", IanStewart],
  ["District Energy Plant", DistrictEnergy],
]);

function CampusBuildingsByGroup({ groups }: { groups: string[] }) {
  return (
    <>
      {BUILDINGS.filter((building) => groups.includes(building.abbr)).map((building) => {
        const special = SPECIAL_RENDERERS.get(building.name);
        return special ? <group key={building.name}>{special()}</group> : <StandardBuilding key={building.name} building={building} />;
      })}
    </>
  );
}

export function CoreAcademicBuildings() {
  return <CampusBuildingsByGroup groups={["LIB", "MCL", "CLE", "COR", "BEC", "DTB", "MAC", "HSD", "ELL", "FRA", "CSB", "HWC", "MUL"]} />;
}

export function EngineeringCluster() {
  return <CampusBuildingsByGroup groups={["BWC", "ECS", "EOW", "ELW", "PET", "CUN", "MSB"]} />;
}

export function ScienceBuildings() {
  return null;
}

export function StudentLifeBuildings() {
  return <CampusBuildingsByGroup groups={["SUB", "CSE", "JCC", "DSB", "FPH", "HAL"]} />;
}

export function ResidenceCluster() {
  return <CampusBuildingsByGroup groups={["CHK", "SNG"]} />;
}

export function AthleticsArea() {
  return <CampusBuildingsByGroup groups={["CAR", "PKD", "MCK", "ISC"]} />;
}

export function SpecialStructures() {
  return (
    <>
      <CampusBuildingsByGroup groups={["FAC", "VAC", "PHX", "SAU", "DEP"]} />
      <group name="Water Tower" position={[0, groundY(-220, -10), 0]}>
        <BuildingBlock x={-220} z={-10} w={8} d={8} h={2} color="#9a9a9a" roofColor="#777777" />
        <Cyl pos={[-220, 17, -10] as V3} rt={2.5} rb={2.5} h={30} segs={20} color="#c0c0c0" metalness={0.3} />
      </group>
    </>
  );
}
