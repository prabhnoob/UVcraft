import { useMemo } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";

export type V3 = [number, number, number];

export function Box({
  pos,
  size,
  color,
  opacity = 1,
  roughness = 0.78,
  metalness = 0,
}: {
  pos: V3;
  size: V3;
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

export function Slab({
  pos,
  w,
  d,
  color,
  h = 0.08,
  roughness = 0.9,
}: {
  pos: V3;
  w: number;
  d: number;
  color: string;
  h?: number;
  roughness?: number;
}) {
  return (
    <mesh position={pos} receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

export function Glass({
  pos,
  size,
  color = "#78b8d0",
  opacity = 0.55,
}: {
  pos: V3;
  size: V3;
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.08} metalness={0.25} transparent opacity={opacity} />
    </mesh>
  );
}

export function Cyl({
  pos,
  rt,
  rb,
  h,
  segs = 12,
  color,
  roughness = 0.65,
  metalness = 0,
}: {
  pos: V3;
  rt: number;
  rb: number;
  h: number;
  segs?: number;
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <cylinderGeometry args={[rt, rb, h, segs]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

export function BuildingBlock({
  name,
  x,
  z,
  w,
  d,
  h,
  color,
  roofColor,
  children,
}: {
  name?: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roofColor?: string;
  children?: ReactNode;
}) {
  return (
    <group name={name}>
      <Box pos={[x, h / 2, z]} size={[w, h, d]} color={color} roughness={0.82} />
      <Box pos={[x, h + 0.14, z]} size={[w + 0.5, 0.28, d + 0.5]} color={roofColor ?? color} roughness={0.74} />
      {children}
    </group>
  );
}

export function Building({
  name,
  x,
  z,
  w,
  d,
  floors,
  color,
  roofColor,
  glassColor = "#172a38",
  floorHeight = 3.5,
  children,
}: {
  name?: string;
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  color: string;
  roofColor?: string;
  glassColor?: string;
  floorHeight?: number;
  children?: ReactNode;
}) {
  const h = floors * floorHeight;
  const frontCols = Math.max(3, Math.floor(w / 9));
  const sideCols = Math.max(2, Math.floor(d / 9));

  return (
    <BuildingBlock name={name} x={x} z={z} w={w} d={d} h={h} color={color} roofColor={roofColor}>
      {Array.from({ length: floors }).map((_, floor) => {
        const y = floor * floorHeight + floorHeight * 0.58;
        return (
          <group key={floor}>
            {Array.from({ length: frontCols }).map((_, i) => {
              const wx = x - w * 0.42 + (w * 0.84 * i) / Math.max(1, frontCols - 1);
              return (
                <group key={`f-${i}`}>
                  <Box pos={[wx, y, z + d / 2 + 0.06]} size={[2.6, 1.15, 0.08]} color={glassColor} metalness={0.2} />
                  <Box pos={[wx, y, z - d / 2 - 0.06]} size={[2.6, 1.15, 0.08]} color={glassColor} metalness={0.2} />
                </group>
              );
            })}
            {Array.from({ length: sideCols }).map((_, i) => {
              const wz = z - d * 0.36 + (d * 0.72 * i) / Math.max(1, sideCols - 1);
              return (
                <group key={`s-${i}`}>
                  <Box pos={[x + w / 2 + 0.06, y, wz]} size={[0.08, 1.15, 2.4]} color={glassColor} metalness={0.2} />
                  <Box pos={[x - w / 2 - 0.06, y, wz]} size={[0.08, 1.15, 2.4]} color={glassColor} metalness={0.2} />
                </group>
              );
            })}
          </group>
        );
      })}
      {children}
    </BuildingBlock>
  );
}

export function Tree({
  x,
  z,
  scale = 1,
  color = "#2d5a27",
  kind = "conifer",
}: {
  x: number;
  z: number;
  scale?: number;
  color?: string;
  kind?: "conifer" | "broadleaf";
}) {
  if (kind === "broadleaf") {
    return (
      <group position={[x, 0, z]}>
        <Cyl pos={[0, 3.4 * scale, 0]} rt={0.45 * scale} rb={0.75 * scale} h={6.8 * scale} segs={8} color="#5a3518" />
        {[
          [0, 9.5, 0, 3.3],
          [2.1, 8.7, 0.8, 2.7],
          [-2.1, 8.5, -0.8, 2.8],
          [0.2, 11.0, -1.4, 2.5],
        ].map(([ox, oy, oz, r], i) => (
          <mesh key={i} position={[ox * scale, oy * scale, oz * scale]} castShadow>
            <sphereGeometry args={[r * scale, 9, 7]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : "#4e7f35"} roughness={0.92} flatShading />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[x, 0, z]}>
      <Cyl pos={[0, 5.5 * scale, 0]} rt={0.45 * scale} rb={0.85 * scale} h={11 * scale} segs={8} color="#4a2808" />
      {[
        [10.5, 4.3],
        [15.2, 3.6],
        [19.1, 2.8],
        [22.2, 1.8],
      ].map(([y, r], i) => (
        <mesh key={i} position={[0, y * scale, 0]} castShadow>
          <coneGeometry args={[r * scale, 7.8 * scale, 8]} />
          <meshStandardMaterial color={i === 1 ? "#225f29" : color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function Chimney({ x, z, h = 15, r = 1.5, color = "#666666" }: { x: number; z: number; h?: number; r?: number; color?: string }) {
  return <Cyl pos={[x, h / 2, z]} rt={r} rb={r} h={h} segs={16} color={color} roughness={0.5} metalness={0.15} />;
}

export function Dome({ x, z, y, r, color = "#e8e8e8" }: { x: number; z: number; y: number; r: number; color?: string }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <icosahedronGeometry args={[r, 1]} />
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.16} flatShading />
    </mesh>
  );
}

export function Spire({ x, z, baseY = 0, h = 20, r = 8, color = "#888880" }: { x: number; z: number; baseY?: number; h?: number; r?: number; color?: string }) {
  return (
    <mesh position={[x, baseY + h / 2, z]} castShadow>
      <coneGeometry args={[r, h, 4]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.25} />
    </mesh>
  );
}

export function Canopy({
  x,
  z,
  y,
  w,
  d,
  color = "#2a2a2a",
  tilt = -0.18,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  color?: string;
  tilt?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[tilt, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.18, d]} />
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.35} />
    </mesh>
  );
}

export function FieldLines({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const line = "#f3f3e8";
  return (
    <group>
      <Slab pos={[x, 0.095, z + d / 2 - 1]} w={w} d={0.55} color={line} h={0.035} />
      <Slab pos={[x, 0.095, z - d / 2 + 1]} w={w} d={0.55} color={line} h={0.035} />
      <Slab pos={[x - w / 2 + 1, 0.095, z]} w={0.55} d={d} color={line} h={0.035} />
      <Slab pos={[x + w / 2 - 1, 0.095, z]} w={0.55} d={d} color={line} h={0.035} />
      <Slab pos={[x, 0.1, z]} w={0.55} d={d} color={line} h={0.035} />
      <mesh position={[x, 0.11, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 8.4, 32]} />
        <meshStandardMaterial color={line} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function PitchedRoof({ x, z, y, w, d, h, color }: { x: number; z: number; y: number; w: number; d: number; h: number; color: string }) {
  const geometry = useMemo(() => {
    const hw = w / 2;
    const hd = d / 2;
    const vertices = new Float32Array([
      -hw, 0, -hd, hw, 0, -hd, 0, h, -hd,
      -hw, 0, hd, 0, h, hd, hw, 0, hd,
      -hw, 0, -hd, -hw, 0, hd, hw, 0, hd, hw, 0, -hd,
      -hw, 0, -hd, 0, h, -hd, 0, h, hd, -hw, 0, hd,
      hw, 0, -hd, hw, 0, hd, 0, h, hd, 0, h, -hd,
    ]);
    const indices = [
      0, 1, 2, 3, 4, 5,
      6, 7, 8, 6, 8, 9,
      10, 11, 12, 10, 12, 13,
      14, 15, 16, 14, 16, 17,
    ];
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [w, d, h]);

  return (
    <mesh geometry={geometry} position={[x, y, z]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}

export function TotemPole({ x, z, h = 10 }: { x: number; z: number; h?: number }) {
  return (
    <group>
      <Cyl pos={[x, h / 2, z]} rt={0.45} rb={0.55} h={h} segs={8} color="#6b3f22" roughness={0.78} />
      {[1.8, 4.5, 7.2].map((y, i) => (
        <Box key={i} pos={[x, y, z + 0.48]} size={[0.7, 0.9, 0.18]} color={["#c85020", "#2a7090", "#d0b040"][i]} />
      ))}
    </group>
  );
}

export function BuildingShell({
  cx,
  cz,
  fw,
  fd,
  floors,
  flH,
  color,
  roofColor,
  winColor,
  children,
}: {
  cx: number;
  cz: number;
  fw: number;
  fd: number;
  floors: number;
  flH: number;
  color: string;
  roofColor?: string;
  winColor?: string;
  children?: ReactNode;
}) {
  return (
    <Building x={cx} z={cz} w={fw} d={fd} floors={floors} floorHeight={flH} color={color} roofColor={roofColor} glassColor={winColor}>
      {children}
    </Building>
  );
}
