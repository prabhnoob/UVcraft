/**
 * UVCraft — Medium-poly UVic Campus Recreation
 *
 * SCALE: 1 Three.js unit = 3 metres
 *   Ring Road diameter = 600 m  →  radius = 100 units
 *   Typical floor height ≈ 4 m  →  1.33 units
 *
 * COORDINATE SYSTEM (top-down, north = -Z, east = +X):
 *   Matches the UVic PDF campus map orientation.
 */

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Line } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

// ─── Scale helper: metres → Three.js units ────────────────────────────────────
const M = (metres: number) => metres / 3;

type V3 = [number, number, number];

// ─── Reusable primitives ──────────────────────────────────────────────────────

function Box({
  pos, size, color, opacity = 1, roughness = 0.78, metalness = 0,
}: {
  pos: V3; size: V3; color: string;
  opacity?: number; roughness?: number; metalness?: number;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color} roughness={roughness} metalness={metalness}
        transparent={opacity < 1} opacity={opacity}
      />
    </mesh>
  );
}

function Slab({ pos, w, d, color }: { pos: V3; w: number; d: number; color: string }) {
  return (
    <mesh position={pos} receiveShadow>
      <boxGeometry args={[w, 0.18, d]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// ─── Ring Road — true 600 m diameter circle ──────────────────────────────────

function RingRoad() {
  const outerR = M(300); // 100 units
  const roadW  = M(9);

  const ringGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, outerR - roadW, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape, 128);
  }, [outerR, roadW]);

  const outerLine = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * outerR, 0.06, Math.sin(a) * outerR));
    }
    return pts;
  }, [outerR]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <primitive object={ringGeo} />
        <meshStandardMaterial color="#484848" roughness={0.88} />
      </mesh>
      <Line points={outerLine} color="#777" lineWidth={1.2} />
    </group>
  );
}

// ─── Ground ───────────────────────────────────────────────────────────────────

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[M(900), M(900)]} />
        <meshStandardMaterial color="#3a7d44" roughness={0.95} />
      </mesh>
      {/* Central quad paving */}
      <Slab pos={[M(-10), 0.07, M(-30)]} w={M(110)} d={M(90)} color="#bfb89a" />
      {/* Quad inner lawn */}
      <Slab pos={[M(-10), 0.10, M(-30)]} w={M(90)} d={M(68)} color="#4cad56" />
    </group>
  );
}

// ─── Internal paths ───────────────────────────────────────────────────────────

function Paths() {
  const p = "#c4aa72";
  const paths: Array<[V3, number, number]> = [
    [[M(-10), 0.09, M(0)],    M(10),  M(560)],  // N-S spine (Campus Greenway)
    [[M(0),   0.09, M(-70)],  M(520), M(8)],     // Main E-W (McGill Rd level)
    [[M(0),   0.09, M(15)],   M(420), M(6)],     // Secondary E-W
    [[M(-80), 0.09, M(-20)],  M(6),   M(110)],   // To SUB/HSD
    [[M(105), 0.09, M(-20)],  M(6),   M(110)],   // To Engineering
    [[M(30),  0.09, M(110)],  M(6),   M(160)],   // Sinclair Rd south
    [[M(-10), 0.09, M(-120)], M(10),  M(70)],    // McKenzie north approach
  ];
  return (
    <group>
      {paths.map(([pos, w, d], i) => (
        <Slab key={i} pos={pos} w={w} d={d} color={p} />
      ))}
    </group>
  );
}

// ─── Building factory ─────────────────────────────────────────────────────────
/**
 * Produces a multi-storey building with window arrays on all four faces.
 * cx, cz = centre of footprint in Three.js units
 * fw, fd  = footprint width (E-W) and depth (N-S)
 * floors  = above-ground floor count
 * flH     = floor-to-floor height in Three.js units (default M(4))
 */
function Building({
  cx, cz, fw, fd, floors, color, roofColor = "#555",
  windowColor = "#1e3a5c", flH = M(4), children,
}: {
  cx: number; cz: number; fw: number; fd: number; floors: number;
  color: string; roofColor?: string; windowColor?: string;
  flH?: number; children?: React.ReactNode;
}) {
  const totalH = floors * flH;

  // Window grid: evenly spaced columns per face, one per floor
  const winW = Math.min(fw * 0.14, M(3.2));
  const winH = flH * 0.42;
  const colsEW = Math.max(2, Math.floor(fw / (winW * 2.4)));
  const colsNS = Math.max(2, Math.floor(fd / (winW * 2.4)));

  const windows: JSX.Element[] = [];

  for (let f = 0; f < floors; f++) {
    const wy = f * flH + flH * 0.52;
    // +Z and -Z faces (E-W orientation)
    for (let c = 0; c < colsEW; c++) {
      const wx = cx - fw / 2 + (fw / (colsEW + 1)) * (c + 1);
      [cz + fd / 2 + 0.04, cz - fd / 2 - 0.04].forEach((wz, fi) => {
        windows.push(
          <mesh key={`ew-${f}-${c}-${fi}`} position={[wx, wy, wz]}>
            <boxGeometry args={[winW, winH, 0.05]} />
            <meshStandardMaterial color={windowColor} roughness={0.1} metalness={0.35} />
          </mesh>
        );
      });
      // +X and -X faces (N-S orientation)
    }
    for (let c = 0; c < colsNS; c++) {
      const wz = cz - fd / 2 + (fd / (colsNS + 1)) * (c + 1);
      [cx + fw / 2 + 0.04, cx - fw / 2 - 0.04].forEach((wx, fi) => {
        windows.push(
          <mesh key={`ns-${f}-${c}-${fi}`} position={[wx, wy, wz]}>
            <boxGeometry args={[0.05, winH, winW]} />
            <meshStandardMaterial color={windowColor} roughness={0.1} metalness={0.35} />
          </mesh>
        );
      });
    }
  }

  return (
    <group>
      {/* Body */}
      <mesh position={[cx, totalH / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[fw, totalH, fd]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Roof slab */}
      <mesh position={[cx, totalH + 0.09, cz]}>
        <boxGeometry args={[fw + 0.15, 0.18, fd + 0.15]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} />
      </mesh>
      {windows}
      {children}
    </group>
  );
}

// ─── Landmark buildings ───────────────────────────────────────────────────────

/** McPherson Library — 4 storeys (1964) + Mearns wing (2008) */
function Library() {
  const fl = M(4.2);
  return (
    <group>
      <Building cx={M(-90)} cz={M(-52)} fw={M(62)} fd={M(46)} floors={4}
        flH={fl} color="#8b3a2b" roofColor="#6b2a1e" windowColor="#1b3050"
      >
        {/* Entrance canopy */}
        <Box pos={[M(-90), fl * 0.55, M(-28)]} size={[M(22), M(1.2), M(4)]} color="#6b2a1e" />
        {/* Entrance doors */}
        <Box pos={[M(-90), fl * 0.4, M(-27)]} size={[M(10), fl * 0.7, M(0.3)]} color="#1a2a40" />
      </Building>
      {/* Mearns wing — NE addition, 3 floors */}
      <Building cx={M(-60)} cz={M(-40)} fw={M(30)} fd={M(28)} floors={3}
        flH={fl} color="#9a4535" roofColor="#7a2f22" windowColor="#1b3050"
      />
      {/* Sign post */}
      <Box pos={[M(-90), M(3), M(-22)]} size={[M(0.5), M(6), M(0.5)]} color="#1a1a1a" />
      <Box pos={[M(-90), M(7), M(-22)]} size={[M(14), M(2.5), M(0.5)]} color="#8b3a2b" />
    </group>
  );
}

/** Clearihue — U-shaped humanities building (1961), quadrangle plan */
function Clearihue() {
  const fl = M(4.0);
  const c = "#c4aa80"; const r = "#9a8860";
  return (
    <group>
      <Building cx={M(20)} cz={M(-82)} fw={M(85)} fd={M(20)} floors={3} flH={fl} color={c} roofColor={r} />
      <Building cx={M(20)} cz={M(-42)} fw={M(85)} fd={M(20)} floors={3} flH={fl} color={c} roofColor={r} />
      <Building cx={M(-20)} cz={M(-62)} fw={M(20)} fd={M(22)} floors={3} flH={fl} color={c} roofColor={r} />
      <Building cx={M(60)} cz={M(-62)} fw={M(20)} fd={M(22)} floors={3} flH={fl} color={c} roofColor={r} />
      <Slab pos={[M(20), 0.12, M(-62)]} w={M(45)} d={M(22)} color="#d4c8a8" />
    </group>
  );
}

/** Cornett — 3 floors, 1967, social sciences */
function Cornett() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(-58)} cz={M(-72)} fw={M(58)} fd={M(32)} floors={3} flH={fl}
        color="#b8a070" roofColor="#8a7050"
      />
      <Building cx={M(-38)} cz={M(-56)} fw={M(22)} fd={M(18)} floors={2} flH={fl}
        color="#c0aa78" roofColor="#8a7050"
      />
    </group>
  );
}

/** David Turpin Building — 5 levels, grass roof, LEED */
function DavidTurpin() {
  const fl = M(4.2);
  return (
    <group>
      <Building cx={M(-28)} cz={M(22)} fw={M(58)} fd={M(36)} floors={5}
        flH={fl} color="#7a9080" roofColor="#4a7050" windowColor="#1b4050"
      />
      {/* Green roof overlay */}
      <Slab pos={[M(-28), fl * 5 + 0.22, M(22)]} w={M(58)} d={M(36)} color="#3a8040" />
    </group>
  );
}

/** MacLaurin — 3-4 floors, arts/education */
function MacLaurin() {
  return (
    <Building cx={M(32)} cz={M(42)} fw={M(52)} fd={M(32)} floors={3}
      flH={M(4.0)} color="#a08060" roofColor="#786040"
    />
  );
}

/** Human & Social Development — 5 storeys, west */
function HSD() {
  return (
    <Building cx={M(-132)} cz={M(-28)} fw={M(58)} fd={M(36)} floors={5}
      flH={M(4.2)} color="#8a7060" roofColor="#604040" windowColor="#1b3050"
    />
  );
}

/** Elliott Building — 4 floors, Chemistry + Physics + Climenhaga dome */
function Elliott() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(62)} cz={M(-12)} fw={M(52)} fd={M(32)} floors={4}
        flH={fl} color="#8a8070" roofColor="#606050"
      />
      {/* Climenhaga Observatory dome */}
      <mesh position={[M(72), fl * 4 + M(5), M(-12)]}>
        <sphereGeometry args={[M(5.5), 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.45} />
      </mesh>
      <Box pos={[M(72), fl * 4 + M(0.5), M(-12)]} size={[M(12), M(1.8), M(12)]} color="#888" />
    </group>
  );
}

/** Bob Wright Centre — 6 floors, 137,000 sq ft, SciCafé + telescope */
function BobWright() {
  const fl = M(4.2);
  return (
    <group>
      <Building cx={M(82)} cz={M(32)} fw={M(58)} fd={M(36)} floors={6}
        flH={fl} color="#6a8090" roofColor="#405060" windowColor="#1a3050"
      >
        {/* SciCafé glazed atrium south face */}
        <Box pos={[M(82), fl * 1.6, M(53)]} size={[M(22), fl * 3.2, M(9)]}
          color="#70c0d8" opacity={0.52} roughness={0.1} metalness={0.2}
        />
      </Building>
      {/* Astronomy dome on roof */}
      <mesh position={[M(92), fl * 6 + M(4), M(32)]}>
        <sphereGeometry args={[M(6.5), 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#909090" roughness={0.25} metalness={0.45} />
      </mesh>
      <Box pos={[M(92), fl * 6 + M(0.6), M(32)]} size={[M(14), M(1.8), M(14)]} color="#888" />
    </group>
  );
}

/** Engineering Complex — ECS (5F) + ELW (4F) + EOW (4F) */
function Engineering() {
  const fl = M(4.2);
  return (
    <group>
      {/* ECS — Engineering/Computer Science main */}
      <Building cx={M(122)} cz={M(-62)} fw={M(58)} fd={M(40)} floors={5}
        flH={fl} color="#6a7a8a" roofColor="#405060" windowColor="#1a2a3a"
      />
      {/* EOW — Office Wing */}
      <Building cx={M(96)} cz={M(-42)} fw={M(36)} fd={M(28)} floors={4}
        flH={fl} color="#607080" roofColor="#405060"
      />
      {/* ELW — Lab Wing */}
      <Building cx={M(128)} cz={M(-20)} fw={M(46)} fd={M(32)} floors={4}
        flH={fl} color="#586878" roofColor="#405060"
      />
      {/* Glass connector between ECS and ELW */}
      <Box pos={[M(122), fl * 2.5, M(-38)]} size={[M(10), fl * 4, M(22)]}
        color="#80c0d8" opacity={0.48} roughness={0.1} metalness={0.2}
      />
      {/* Engineering Garage */}
      <Building cx={M(158)} cz={M(-52)} fw={M(22)} fd={M(16)} floors={2}
        flH={fl} color="#707070" roofColor="#555"
      />
    </group>
  );
}

/** Petch + Cunningham (biology / biochem) */
function PetchCunningham() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(92)} cz={M(-32)} fw={M(36)} fd={M(26)} floors={3} flH={fl}
        color="#7a8870" roofColor="#506050"
      />
      <Building cx={M(92)} cz={M(-62)} fw={M(32)} fd={M(24)} floors={3} flH={fl}
        color="#7a8070" roofColor="#506050"
      />
    </group>
  );
}

/** Medical Sciences Building */
function MedSciences() {
  return (
    <Building cx={M(132)} cz={M(12)} fw={M(42)} fd={M(30)} floors={4}
      flH={M(4.0)} color="#7a8870" roofColor="#506050" windowColor="#1b3040"
    />
  );
}

/** Business & Economics Building */
function BusinessEcon() {
  return (
    <Building cx={M(-88)} cz={M(-92)} fw={M(52)} fd={M(32)} floors={4}
      flH={M(4.0)} color="#b09070" roofColor="#806040"
    />
  );
}

/** Fraser Building — includes Priestly Law Library, south campus */
function Fraser() {
  return (
    <Building cx={M(2)} cz={M(62)} fw={M(46)} fd={M(30)} floors={3}
      flH={M(4.0)} color="#a89070" roofColor="#786040"
    />
  );
}

/** Fine Arts + Visual Arts + Phoenix Theatre cluster */
function FineArts() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(-122)} cz={M(52)} fw={M(42)} fd={M(30)} floors={2} flH={fl}
        color="#9a8075" roofColor="#705060"
      />
      {/* Phoenix Theatre with fly tower */}
      <Building cx={M(-148)} cz={M(42)} fw={M(26)} fd={M(22)} floors={2} flH={fl}
        color="#806070" roofColor="#504060"
      />
      <Box pos={[M(-148), fl * 4.5, M(42)]} size={[M(20), fl * 4, M(20)]} color="#706060" />
    </group>
  );
}

/** CARSA — 2 sports floors + climbing tower */
function CARSA() {
  const fl = M(5.2);
  return (
    <group>
      <Building cx={M(92)} cz={M(82)} fw={M(72)} fd={M(58)} floors={2}
        flH={fl} color="#1e1e1e" roofColor="#111" windowColor="#4ab0cc"
      >
        {/* Glass curtain north face */}
        <Box pos={[M(92), fl * 0.9, M(54)]} size={[M(58), fl * 1.7, M(2.5)]}
          color="#60c0d8" opacity={0.52} roughness={0.1} metalness={0.25}
        />
        {/* Orange stripe west face */}
        <Box pos={[M(54), fl * 1.0, M(82)]} size={[M(2.5), fl * 2, M(58)]} color="#e67e22" />
      </Building>
      {/* Climbing tower — 4 tall floors */}
      <Building cx={M(122)} cz={M(70)} fw={M(14)} fd={M(14)} floors={4}
        flH={fl * 0.75} color="#2a2a2a" roofColor="#111"
      >
        {/* Hold bumps */}
        {[-1, 0, 1].map((r) => (
          <Box key={r} pos={[M(122 + r * 3), fl * 2, M(78)]}
            size={[M(2), M(2), M(0.6)]} color="#e67e22"
          />
        ))}
      </Building>
      {/* Centennial Stadium */}
      <Slab pos={[M(62), 0.14, M(106)]} w={M(82)} d={M(62)} color="#3a7a3a" />
      <mesh position={[M(62), 0.16, M(106)]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[M(22), M(30), 64]} />
        <meshStandardMaterial color="#c87040" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Ian Stewart Complex — pool + squash */
function IanStewart() {
  return (
    <Building cx={M(52)} cz={M(82)} fw={M(46)} fd={M(38)} floors={2}
      flH={M(5.0)} color="#5a7080" roofColor="#405060"
    />
  );
}

/** Student Union Building + Campus Services */
function SUB() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(-62)} cz={M(32)} fw={M(58)} fd={M(42)} floors={3}
        flH={fl} color="#c79a58" roofColor="#9a7035" windowColor="#3b2f2f"
      >
        <Box pos={[M(-62), fl * 0.58, M(55)]} size={[M(20), M(1.2), M(5)]} color="#9a7035" />
        <Box pos={[M(-62), fl * 0.42, M(54)]} size={[M(12), fl * 0.72, M(0.4)]} color="#1a1a1a" />
      </Building>
      {/* Campus Services (bookstore/Starbucks) */}
      <Building cx={M(-88)} cz={M(52)} fw={M(36)} fd={M(26)} floors={2}
        flH={fl} color="#c0a060" roofColor="#8a7040"
      />
    </group>
  );
}

/** First Peoples House */
function FirstPeoplesHouse() {
  const fl = M(4.0);
  return (
    <group>
      <Building cx={M(-45)} cz={M(-22)} fw={M(22)} fd={M(16)} floors={2}
        flH={fl} color="#8b6040" roofColor="#6b4020"
      />
      <Box pos={[M(-35), M(8), M(-28)]} size={[M(1.5), M(16), M(1.5)]} color="#6b4020" />
    </group>
  );
}

/** New student residences — Cheko'nien + Sngequ (2023, 10 floors) */
function NewResidences() {
  const fl = M(3.5);
  return (
    <group>
      <Building cx={M(-28)} cz={M(90)} fw={M(30)} fd={M(18)} floors={10}
        flH={fl} color="#7a9090" roofColor="#506070" windowColor="#2a4a6a"
      />
      <Building cx={M(8)} cz={M(95)} fw={M(30)} fd={M(18)} floors={10}
        flH={fl} color="#6a8080" roofColor="#405060" windowColor="#2a4a6a"
      />
      {/* Plaza between */}
      <Slab pos={[M(-10), 0.14, M(92)]} w={M(28)} d={M(18)} color="#c0b898" />
      {/* Stormwater pond */}
      <Slab pos={[M(-10), 0.18, M(92)]} w={M(10)} d={M(8)} color="#4080a0" />
    </group>
  );
}

/** Lam Family + Gordon Head residences clusters */
function OtherResidences() {
  const fl = M(3.8);
  const lam: V3[] = [
    [M(-80), 0, M(100)], [M(-55), 0, M(106)], [M(-95), 0, M(116)],
    [M(-70), 0, M(120)], [M(-50), 0, M(120)],
  ];
  const gh: V3[] = [
    [M(32), 0, M(120)], [M(52), 0, M(126)], [M(72), 0, M(120)],
  ];
  return (
    <group>
      {lam.map((p, i) => (
        <Building key={i} cx={p[0]} cz={p[2]} fw={M(18)} fd={M(13)} floors={3}
          flH={fl} color="#7a9a6a" roofColor="#4a7040"
        />
      ))}
      {gh.map((p, i) => (
        <Building key={i} cx={p[0]} cz={p[2]} fw={M(20)} fd={M(14)} floors={2}
          flH={fl} color="#6a8a5a" roofColor="#4a6040"
        />
      ))}
    </group>
  );
}

/** Transit Exchange — NE inside ring road */
function TransitExchange() {
  return (
    <group>
      <Slab pos={[M(82), 0.12, M(-85)]} w={M(65)} d={M(38)} color="#3a3a3a" />
      {[M(65), M(82), M(98)].map((x, i) => (
        <group key={i}>
          <Box pos={[x, M(2.8), M(-70)]} size={[M(13), M(3.2), M(4.5)]}
            color="#4a7a9b" opacity={0.72}
          />
          <Box pos={[x, M(4.8), M(-70)]} size={[M(14), M(0.6), M(5.5)]} color="#2a4a6a" />
        </group>
      ))}
    </group>
  );
}

/** Water tower */
function WaterTower() {
  return (
    <group position={[M(-65), 0, M(65)]}>
      {[[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([x, z], i) => (
        <Box key={i} pos={[M(x), M(11), M(z)]} size={[M(1.4), M(22), M(1.4)]} color="#888" />
      ))}
      <mesh position={[0, M(24), 0]}>
        <cylinderGeometry args={[M(7.5), M(7.5), M(10), 14]} />
        <meshStandardMaterial color="#8090a0" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, M(29.5), 0]}>
        <coneGeometry args={[M(8), M(4.5), 14]} />
        <meshStandardMaterial color="#606878" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Trees ────────────────────────────────────────────────────────────────────

function Tree({ pos, h = 1.0 }: { pos: V3; h?: number }) {
  const tH = M(5) * h;
  const tW = M(1.6) * h;
  const c1r = M(7) * h; const c1h = M(8) * h;
  const c2r = M(9) * h; const c2h = M(6) * h;
  const c3r = M(5) * h; const c3h = M(9) * h;

  return (
    <group position={pos}>
      <mesh position={[0, tH / 2, 0]} castShadow>
        <cylinderGeometry args={[tW * 0.55, tW, tH, 7]} />
        <meshStandardMaterial color="#5a3010" roughness={0.9} />
      </mesh>
      <mesh position={[0, tH + c2h * 0.38, 0]} castShadow>
        <coneGeometry args={[c2r, c2h, 7]} />
        <meshStandardMaterial color="#1e5e30" roughness={0.9} />
      </mesh>
      <mesh position={[0, tH + c2h * 0.72 + c1h * 0.38, 0]} castShadow>
        <coneGeometry args={[c1r, c1h, 7]} />
        <meshStandardMaterial color="#267a3e" roughness={0.9} />
      </mesh>
      <mesh position={[0, tH + c2h * 0.72 + c1h * 0.76 + c3h * 0.38, 0]} castShadow>
        <coneGeometry args={[c3r, c3h, 6]} />
        <meshStandardMaterial color="#1a5028" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Trees() {
  const trees: Array<{ pos: V3; h?: number }> = [
    // Ring Road interior perimeter
    ...[-80,-55,-25,5,35,65].map(x => ({ pos: [M(x), 0, M(-96)] as V3 })),
    ...[-80,-55,-25,5,35,65].map(x => ({ pos: [M(x), 0, M(96)] as V3 })),
    ...[-65,-38,-12].map(z => ({ pos: [M(-97), 0, M(z)] as V3 })),
    ...[-65,-38,-12].map(z => ({ pos: [M(97), 0, M(z)] as V3 })),
    // Quad edges
    [M(-50), 0, M(-68)], [M(12), 0, M(-68)],
    [M(-50), 0, M(8)],   [M(12), 0, M(8)],
    [M(-25), 0, M(-50)], [M(2),  0, M(-50)],
    // Along campus greenway
    [M(-10), 0, M(-55)], [M(-10), 0, M(50)],
    // Mystic Vale / south woods
    ...[...Array(10)].map((_, i) => ({
      pos: [M(-160 + i * 15), 0, M(140)] as V3, h: 1.45,
    })),
    // Cunningham Woods north
    ...[...Array(9)].map((_, i) => ({
      pos: [M(-145 + i * 16), 0, M(-138)] as V3, h: 1.3,
    })),
    // Scattered interior
    { pos: [M(28), 0, M(-82)] as V3 },
    { pos: [M(-8), 0, M(-82)] as V3 },
    { pos: [M(-8), 0, M(72)] as V3 },
    { pos: [M(-8), 0, M(-118)] as V3, h: 1.1 },
  ].map(item =>
    Array.isArray(item) ? { pos: item as V3 } : item
  ) as Array<{ pos: V3; h?: number }>;

  return (
    <>
      {trees.map(({ pos, h }, i) => <Tree key={i} pos={pos} h={h} />)}
    </>
  );
}

/** Finnerty Gardens */
function FinnertryGardens() {
  const flowers = [
    [0, "#e74c8b"], [M(8), "#f39c12"], [M(-8), "#8e44ad"],
    [M(0), "#e74c3c"], [M(4), "#f1c40f"], [M(-4), "#3498db"],
  ] as Array<[number, string]>;
  const cx = M(-120), cz = M(76);
  return (
    <group>
      <Slab pos={[cx, 0.14, cz]} w={M(32)} d={M(26)} color="#c8b888" />
      {flowers.map(([dx, c], i) => (
        <group key={i}>
          <Box pos={[cx + dx, M(0.7), cz + (i % 2 === 0 ? M(5) : M(-5))]}
            size={[M(5), M(2), M(5)]} color={c}
          />
          <mesh position={[cx + dx, M(2.5), cz + (i % 2 === 0 ? M(5) : M(-5))]}>
            <sphereGeometry args={[M(3.2), 7, 6]} />
            <meshStandardMaterial color={c} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Benches along the quad */
function Benches() {
  const spots: V3[] = [
    [M(-12), 0, M(-12)], [M(12), 0, M(-12)],
    [M(-12), 0, M(-52)], [M(12), 0, M(-52)],
    [M(0),   0, M(12)],  [M(-42), 0, M(-22)],
  ];
  return (
    <>
      {spots.map((pos, i) => (
        <group key={i} position={pos}>
          <Box pos={[0, M(1.2), 0]} size={[M(4.5), M(0.5), M(1.4)]} color="#6b3f22" />
          <Box pos={[M(-1.3), M(0.6), 0]} size={[M(0.4), M(1.5), M(0.4)]} color="#333" />
          <Box pos={[M(1.3),  M(0.6), 0]} size={[M(0.4), M(1.5), M(0.4)]} color="#333" />
        </group>
      ))}
    </>
  );
}

// ─── Full Scene ───────────────────────────────────────────────────────────────

function CampusWorld() {
  return (
    <>
      <ambientLight intensity={0.58} />
      <directionalLight
        position={[M(250), M(350), M(150)]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={M(1400)}
        shadow-camera-left={M(-500)}
        shadow-camera-right={M(500)}
        shadow-camera-top={M(500)}
        shadow-camera-bottom={M(-500)}
      />
      <Sky sunPosition={[100, 28, 70]} />
      <Ground />
      <RingRoad />
      <Paths />

      <Library />
      <Clearihue />
      <Cornett />
      <DavidTurpin />
      <MacLaurin />
      <HSD />
      <Elliott />
      <BobWright />
      <Engineering />
      <PetchCunningham />
      <MedSciences />
      <BusinessEcon />
      <Fraser />
      <FineArts />
      <SUB />
      <CARSA />
      <IanStewart />
      <FirstPeoplesHouse />
      <TransitExchange />
      <NewResidences />
      <OtherResidences />
      <Trees />
      <Benches />
      <FinnertryGardens />
      <WaterTower />

      <OrbitControls
        target={[0, M(10), 0]}
        minDistance={M(40)}
        maxDistance={M(1400)}
        maxPolarAngle={Math.PI / 2 - 0.015}
      />
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const LEGEND = [
  ["🔴", "McPherson Library (4F + Mearns)"],
  ["🟡", "Clearihue (3F, quad plan, 1961)"],
  ["🟤", "Cornett (3F, 1967)"],
  ["🌿", "David Turpin (5F, grass roof)"],
  ["🔵", "Elliott + Climenhaga Dome"],
  ["🩶", "Bob Wright Centre (6F)"],
  ["⚙️",  "Engineering ECS/ELW/EOW"],
  ["⬛", "CARSA + Climbing Tower"],
  ["🍁", "SUB + Campus Services"],
  ["🏗️", "Cheko'nien + Sngequ (10F, 2023)"],
  ["🏠", "Lam / Gordon Head Residences"],
  ["🚌", "Transit Exchange (NE)"],
  ["💧", "Water Tower"],
];

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#87ceeb" }}>
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        background: "rgba(6,14,6,0.82)", color: "#e8f5e9",
        padding: "12px 18px", borderRadius: 8, pointerEvents: "none",
        fontFamily: "'Courier New', monospace", fontSize: 13,
        borderLeft: "3px solid #4caf50", backdropFilter: "blur(4px)",
      }}>
        <div style={{ fontSize: 19, fontWeight: "bold", letterSpacing: 3, marginBottom: 3 }}>
          🎓 UVCraft
        </div>
        <div style={{ opacity: 0.72, marginBottom: 5, fontSize: 11 }}>
          University of Victoria — Medium Poly
        </div>
        <div style={{ opacity: 0.55, fontSize: 10.5, borderTop: "1px solid #4caf5055", paddingTop: 4 }}>
          1 unit = 3 m · Ring Road ⌀ = 600 m (true scale)
          <br />🖱 Drag = rotate · Scroll = zoom · Right = pan
        </div>
      </div>

      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        background: "rgba(6,14,6,0.82)", color: "#e8f5e9",
        padding: "10px 14px", borderRadius: 8,
        fontFamily: "'Courier New', monospace", fontSize: 11,
        lineHeight: 1.85, backdropFilter: "blur(4px)",
      }}>
        <div style={{ fontWeight: "bold", marginBottom: 4, fontSize: 12, letterSpacing: 1 }}>
          BUILDINGS
        </div>
        {LEGEND.map(([icon, name]) => (
          <div key={name as string}>{icon} {name}</div>
        ))}
      </div>

      <Canvas
        camera={{ position: [M(80), M(380), M(450)], fov: 42 }}
        shadows
      >
        <CampusWorld />
      </Canvas>
    </div>
  );
}
