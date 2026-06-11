import { useMemo } from "react";
import { Billboard, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { Box, Cyl, Slab, TotemPole, Tree } from "./primitives";
import { BUILDINGS, CALIBRATION_POINTS, buildingPosition, buildingRotation } from "./geo";
import { terrainHeight } from "./terrain";
import {
  AthleticsArea,
  CoreAcademicBuildings,
  EngineeringCluster,
  ResidenceCluster,
  ScienceBuildings,
  SpecialStructures,
  StudentLifeBuildings,
} from "./specials";
import type { V3 } from "./primitives";

const SHOW_PLACEMENT_CALIBRATION = false;
const LABELED_CALIBRATION_ABBRS = new Set(["LIB", "MCL", "CLE", "MAC", "HSD", "MSB", "ECS", "EOW", "ELW", "PET", "CUN", "ELL", "BWC", "FPH"]);

function labelFor(name: string, abbr: string) {
  if (name.includes("North wing")) return `${abbr}-N`;
  if (name.includes("South wing")) return `${abbr}-S`;
  if (name.includes("West wing")) return `${abbr}-W`;
  if (name.includes("Office Wing")) return "EOW";
  if (name.includes("Lab Wing")) return "ELW";
  if (name.includes("Library wing")) return "MCL";
  return abbr;
}

function FloatingLabel({ x, z, y, text, color = "#f4f1d0", size = 5 }: { x: number; z: number; y: number; text: string; color?: string; size?: number }) {
  return (
    <Billboard position={[x, y, z]} follow>
      <Text fontSize={size} color={color} anchorX="center" anchorY="middle" outlineWidth={0.18} outlineColor="#10200e">
        {text}
      </Text>
    </Billboard>
  );
}

function PlacementCalibrationOverlay() {
  const buildingMarkers = BUILDINGS.map((building) => {
    const [x, z] = buildingPosition(building);
    const y = terrainHeight(x, z) + 2.1;
    const rot = buildingRotation(building);
    const half = Math.max(8, Math.min(18, building.fw * 0.24));
    const dx = Math.cos(rot) * half;
    const dz = -Math.sin(rot) * half;
    return { building, x, z, y, dx, dz };
  });

  return (
    <group name="Placement calibration overlay">
      <gridHelper args={[520, 26, "#4d7b48", "#355f32"]} position={[20, 0.24, 38]} />

      {buildingMarkers.map(({ building, x, z, y, dx, dz }) => (
        <group key={building.name}>
          <mesh position={[x, y, z]} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.55, 10]} />
            <meshStandardMaterial color="#f7dc6f" roughness={0.42} opacity={0.78} transparent />
          </mesh>
          <Line points={[[x - dx, y + 0.8, z - dz], [x + dx, y + 0.8, z + dz]]} color="#f3e7a4" lineWidth={0.8} />
          {LABELED_CALIBRATION_ABBRS.has(building.abbr) && <FloatingLabel x={x} z={z} y={y + 9} text={labelFor(building.name, building.abbr)} size={3.7} />}
        </group>
      ))}

      {CALIBRATION_POINTS.map((point) => {
        const y = terrainHeight(point.x, point.z) + 1.2;
        return (
          <group key={point.id}>
            <mesh position={[point.x, y, point.z]} castShadow>
              <sphereGeometry args={[2.7, 14, 10]} />
              <meshStandardMaterial color={point.color} roughness={0.35} emissive={point.color} emissiveIntensity={0.15} />
            </mesh>
            <Line points={[[point.x, y + 0.8, point.z], [point.x, y + 13, point.z]]} color={point.color} lineWidth={1.0} />
            <FloatingLabel x={point.x} z={point.z} y={y + 18} text={point.label} color={point.color} size={4.2} />
          </group>
        );
      })}

      <Line points={[[-146, 2.2, -112], [-146, 2.2, -172]]} color="#ffffff" lineWidth={2.4} />
      <Line points={[[-146, 2.2, -172], [-155, 2.2, -154]]} color="#ffffff" lineWidth={1.8} />
      <Line points={[[-146, 2.2, -172], [-137, 2.2, -154]]} color="#ffffff" lineWidth={1.8} />
      <FloatingLabel x={-146} z={-187} y={12} text="N" color="#ffffff" size={6} />
    </group>
  );
}

function Ground() {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1000, 1000, 300, 300);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    const low = new THREE.Color("#355f32");
    const mid = new THREE.Color("#4f7f3a");
    const high = new THREE.Color("#6f8d48");
    const scratch = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = -pos.getY(i);
      const h = terrainHeight(x, z);
      pos.setZ(i, h);
      const t = THREE.MathUtils.clamp((h + 4.2) / 6.5, 0, 1);
      scratch.copy(t < 0.55 ? low : mid).lerp(t < 0.55 ? mid : high, t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45);
      colors.push(scratch.r, scratch.g, scratch.b);
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={terrainGeo} attach="geometry" />
      <meshStandardMaterial roughness={0.97} vertexColors />
    </mesh>
  );
}

function RingRoad() {
  const roadW = 13.5;
  const samples = 480;
  const { roadGeo, shoulderGeo, outerEdge, innerEdge, dashGeo } = useMemo(() => {
    const anchors = [
      new THREE.Vector3(-138, 0, -358),
      new THREE.Vector3(12, 0, -360),
      new THREE.Vector3(180, 0, -342),
      new THREE.Vector3(310, 0, -286),
      new THREE.Vector3(382, 0, -170),
      new THREE.Vector3(396, 0, -22),
      new THREE.Vector3(370, 0, 116),
      new THREE.Vector3(318, 0, 240),
      new THREE.Vector3(218, 0, 342),
      new THREE.Vector3(70, 0, 398),
      new THREE.Vector3(-80, 0, 386),
      new THREE.Vector3(-224, 0, 324),
      new THREE.Vector3(-330, 0, 216),
      new THREE.Vector3(-386, 0, 78),
      new THREE.Vector3(-378, 0, -74),
      new THREE.Vector3(-328, 0, -212),
      new THREE.Vector3(-244, 0, -316),
    ];
    const curve = new THREE.CatmullRomCurve3(anchors, true, "centripetal", 0.45);

    const ribbon = (width: number, lift: number) => {
      const vertices: number[] = [];
      const indices: number[] = [];
      const leftPts: THREE.Vector3[] = [];
      const rightPts: THREE.Vector3[] = [];
      for (let i = 0; i <= samples; i++) {
        const p = curve.getPointAt(i / samples);
        const t = curve.getTangentAt(i / samples).normalize();
        const nx = -t.z;
        const nz = t.x;
        const lx = p.x + nx * width * 0.5;
        const lz = p.z + nz * width * 0.5;
        const rx = p.x - nx * width * 0.5;
        const rz = p.z - nz * width * 0.5;
        const left = new THREE.Vector3(lx, terrainHeight(lx, lz) + lift, lz);
        const right = new THREE.Vector3(rx, terrainHeight(rx, rz) + lift, rz);
        leftPts.push(left);
        rightPts.push(right);
        vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
      }
      for (let i = 0; i < samples; i++) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return { geo, leftPts, rightPts };
    };

    const road = ribbon(roadW, 0.13);
    const shoulder = ribbon(roadW + 5.2, 0.09);
    const dashVertices: number[] = [];
    for (let i = 0; i < 90; i += 2) {
      const pts: THREE.Vector3[] = [];
      const t0 = i / 90;
      const t1 = Math.min((i + 0.55) / 90, 1);
      for (let j = 0; j <= 8; j++) {
        const p = curve.getPointAt(t0 + (t1 - t0) * (j / 8));
        pts.push(new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + 0.2, p.z));
      }
      for (let j = 0; j < pts.length - 1; j++) {
        dashVertices.push(pts[j].x, pts[j].y, pts[j].z, pts[j + 1].x, pts[j + 1].y, pts[j + 1].z);
      }
    }
    const dashGeo = new THREE.BufferGeometry();
    dashGeo.setAttribute("position", new THREE.Float32BufferAttribute(dashVertices, 3));
    return {
      roadGeo: road.geo,
      shoulderGeo: shoulder.geo,
      outerEdge: road.leftPts.map((p) => p.clone().setY(p.y + 0.05)),
      innerEdge: road.rightPts.map((p) => p.clone().setY(p.y + 0.05)),
      dashGeo,
    };
  }, []);

  return (
    <group>
      <mesh receiveShadow>
        <primitive object={shoulderGeo} attach="geometry" />
        <meshStandardMaterial color="#6b665c" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow>
        <primitive object={roadGeo} attach="geometry" />
        <meshStandardMaterial color="#444444" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>
      <Line points={outerEdge} color="#888888" lineWidth={1.4} />
      <Line points={innerEdge} color="#777777" lineWidth={1.2} />
      <lineSegments geometry={dashGeo}>
        <lineBasicMaterial color="#e8d870" />
      </lineSegments>
    </group>
  );
}

type WalkwaySpec = { from: [number, number]; to: [number, number]; width: number; color?: string };

const CAMPUS_PATHS: WalkwaySpec[] = [
  { from: [-286, 22], to: [225, 78], width: 7 },
  { from: [-145, -165], to: [282, -120], width: 6 },
  { from: [-150, 92], to: [225, 78], width: 5.5 },
  { from: [20, -245], to: [20, 360], width: 5.5, color: "#bfb07a" },
  { from: [-250, 75], to: [290, 88], width: 4.5, color: "#bfb07a" },
  { from: [-360, 85], to: [-286, 22], width: 4.4, color: "#d1c9a6" },
  { from: [-335, 55], to: [-286, 22], width: 3.8, color: "#d1c9a6" },
  { from: [-320, 25], to: [-286, 22], width: 3.8, color: "#d1c9a6" },
  { from: [-310, -190], to: [-145, -165], width: 4.8, color: "#d1c9a6" },
  { from: [-232, -118], to: [-145, -165], width: 4.2, color: "#d1c9a6" },
  { from: [-145, -165], to: [-50, -125], width: 4.8, color: "#d1c9a6" },
  { from: [-50, -125], to: [-18, -70], width: 4.6, color: "#d1c9a6" },
  { from: [-18, -70], to: [88, -42], width: 4.6, color: "#d1c9a6" },
  { from: [88, -42], to: [142, -80], width: 4.4, color: "#d1c9a6" },
  { from: [142, -80], to: [190, -104], width: 4.2, color: "#d1c9a6" },
  { from: [188, -58], to: [225, 78], width: 5.2, color: "#d1c9a6" },
  { from: [225, 78], to: [290, 88], width: 4.4, color: "#d1c9a6" },
  { from: [282, -120], to: [330, -70], width: 4.0, color: "#d1c9a6" },
  { from: [282, -120], to: [370, -35], width: 4.3, color: "#d1c9a6" },
  { from: [290, 88], to: [370, -35], width: 4.0, color: "#d1c9a6" },
  { from: [225, 78], to: [170, 190], width: 4.8, color: "#d1c9a6" },
  { from: [170, 190], to: [126, 232], width: 4.3, color: "#d1c9a6" },
  { from: [170, 190], to: [235, 222], width: 4.3, color: "#d1c9a6" },
  { from: [126, 232], to: [22, 328], width: 4.2, color: "#d1c9a6" },
  { from: [235, 222], to: [178, 326], width: 4.2, color: "#d1c9a6" },
  { from: [22, 328], to: [92, 368], width: 4.2, color: "#d1c9a6" },
  { from: [92, 368], to: [178, 326], width: 4.2, color: "#d1c9a6" },
  { from: [-126, 258], to: [-40, 222], width: 4.2, color: "#d1c9a6" },
  { from: [-40, 222], to: [20, 360], width: 4.0, color: "#d1c9a6" },
  { from: [-126, 258], to: [-150, 92], width: 4.2, color: "#d1c9a6" },
  { from: [96, -170], to: [-50, -125], width: 4.8, color: "#d1c9a6" },
  { from: [96, -170], to: [282, -120], width: 4.6, color: "#d1c9a6" },
  { from: [96, -170], to: [205, -235], width: 4.2, color: "#d1c9a6" },
  { from: [96, -170], to: [118, -308], width: 4.2, color: "#d1c9a6" },
  { from: [180, -350], to: [238, -350], width: 4.2, color: "#d1c9a6" },
  { from: [118, -308], to: [180, -350], width: 4.2, color: "#d1c9a6" },
  { from: [-40, 222], to: [-126, 258], width: 3.8, color: "#d1c9a6" },
  { from: [-360, 85], to: [-320, 25], width: 3.7, color: "#d1c9a6" },
  { from: [-286, 22], to: [-232, -118], width: 4.0, color: "#d1c9a6" },
];

const QUAD_WALKS: WalkwaySpec[] = [
  { from: [-118, 38], to: [158, 38], width: 5.2, color: "#d6cfad" },
  { from: [18, -74], to: [18, 148], width: 5.2, color: "#d6cfad" },
  { from: [-108, 138], to: [156, -60], width: 3.8, color: "#d6cfad" },
  { from: [-112, -60], to: [166, 132], width: 3.8, color: "#d6cfad" },
];

function Path({ from, to, width = 4, color = "#c8b878" }: { from: [number, number]; to: [number, number]; width?: number; color?: string }) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const geometry = useMemo(() => {
    const samples = Math.max(12, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 12));
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length;
    const nz = dx / length;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const cx = THREE.MathUtils.lerp(x1, x2, t);
      const cz = THREE.MathUtils.lerp(z1, z2, t);
      const leftX = cx + nx * width * 0.5;
      const leftZ = cz + nz * width * 0.5;
      const rightX = cx - nx * width * 0.5;
      const rightZ = cz - nz * width * 0.5;
      vertices.push(
        leftX,
        terrainHeight(leftX, leftZ) + 0.15,
        leftZ,
        rightX,
        terrainHeight(rightX, rightZ) + 0.15,
        rightZ,
      );
    }

    for (let i = 0; i < samples; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [width, x1, x2, z1, z2]);

  return (
    <mesh receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}

function Pathways() {
  return (
    <group>
      {CAMPUS_PATHS.map((path) => (
        <Path key={`${path.from.join(",")}-${path.to.join(",")}`} {...path} />
      ))}
    </group>
  );
}

function QuadWalk({ from, to, width = 4.5 }: { from: [number, number]; to: [number, number]; width?: number }) {
  return <Path from={from} to={to} width={width} color="#d6cfad" />;
}

function PetchFountain() {
  const x = 168;
  const z = 18;
  const waterW = 58;
  const waterD = 32;
  const rockPositions: Array<[number, number, number, number]> = [
    [-22, -7, 4.4, 1.1],
    [-17, -10, 5.2, 1.25],
    [-11, -6, 3.8, 1.0],
    [16, -9, 5.0, 1.2],
    [22, -5, 4.0, 1.0],
    [27, -11, 3.2, 0.9],
  ];
  return (
    <group position={[x, terrainHeight(x, z) + 0.14, z]} name="Petch Fountain">
      <Slab pos={[0, 0.02, 0] as V3} w={waterW + 17} d={waterD + 15} color="#d8c7a3" h={0.04} roughness={0.86} />
      <Slab pos={[0, 0.08, 0] as V3} w={waterW + 4.2} d={waterD + 4.2} color="#82796b" h={0.12} roughness={0.82} />
      <Slab pos={[0, 0.15, 0] as V3} w={waterW} d={waterD} color="#7b6c39" h={0.05} roughness={0.42} />
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[waterW - 1.3, waterD - 1.3, 18, 10]} />
        <meshStandardMaterial color="#8a7440" emissive="#253b25" emissiveIntensity={0.06} roughness={0.18} metalness={0.04} transparent opacity={0.82} side={THREE.DoubleSide} />
      </mesh>
      {[-26, -13, 0, 13, 26].map((px) => (
        <Box key={`brick-front-${px}`} pos={[px, 0.17, waterD / 2 + 3.35] as V3} size={[11.4, 0.05, 3.0]} color={px % 2 === 0 ? "#c77d5a" : "#b86f50"} roughness={0.78} />
      ))}
      {[-26, -13, 0, 13, 26].map((px) => (
        <Box key={`brick-back-${px}`} pos={[px, 0.17, -waterD / 2 - 3.35] as V3} size={[11.4, 0.05, 3.0]} color={px % 2 === 0 ? "#c77d5a" : "#b86f50"} roughness={0.78} />
      ))}
      {[-12, -4, 4, 12].map((pz) => (
        <Box key={`brick-side-left-${pz}`} pos={[-waterW / 2 - 3.0, 0.17, pz] as V3} size={[3.0, 0.05, 7.2]} color="#bd7553" roughness={0.78} />
      ))}
      {[-12, -4, 4, 12].map((pz) => (
        <Box key={`brick-side-right-${pz}`} pos={[waterW / 2 + 3.0, 0.17, pz] as V3} size={[3.0, 0.05, 7.2]} color="#bd7553" roughness={0.78} />
      ))}
      {rockPositions.map(([rx, rz, size, squash], i) => (
        <mesh key={i} position={[rx, 1.3 + size * 0.08, rz]} scale={[size * 0.72, size * 0.5 * squash, size * 0.42]} rotation={[0.08, i * 0.7, -0.08]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#696d66" : "#565c55"} roughness={0.92} flatShading />
        </mesh>
      ))}
      {[-20, -17, 17, 23].map((px, i) => (
        <group key={`fall-${px}`}>
          <Box pos={[px, 1.55, -waterD / 2 + 6.6 + (i % 2) * 1.6] as V3} size={[3.0, 1.85, 0.14]} color="#d6eef3" opacity={0.56} roughness={0.08} />
          <Box pos={[px, 0.36, -waterD / 2 + 8.2 + (i % 2) * 1.6] as V3} size={[3.5, 0.06, 1.9]} color="#dceff2" opacity={0.42} roughness={0.12} />
        </group>
      ))}
      {[-9, -3, 3, 9].map((px, i) => (
        <group key={`jet-${px}`}>
          <Cyl pos={[px, 1.28 + (i % 2) * 0.22, -waterD / 2 + 4.4] as V3} rt={0.04} rb={0.05} h={2.4 + (i % 2) * 0.45} segs={8} color="#d9f1f4" roughness={0.1} />
          <mesh position={[px, 2.62 + (i % 2) * 0.25, -waterD / 2 + 4.4]} castShadow>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color="#eefcff" emissive="#a7e8f2" emissiveIntensity={0.12} roughness={0.12} />
          </mesh>
        </group>
      ))}
      {[-26, 0, 26].map((px) => (
        <group key={`bench-fountain-${px}`} position={[px, 0.08, waterD / 2 + 7.1]}>
          <Box pos={[0, 0.42, 0] as V3} size={[7.2, 0.22, 1.0]} color="#c48235" roughness={0.58} />
          <Box pos={[0, 0.98, -0.52] as V3} size={[7.2, 0.2, 0.25]} color="#a9662e" roughness={0.58} />
          <Box pos={[-2.7, 0.2, 0] as V3} size={[0.24, 0.42, 0.82]} color="#262923" roughness={0.46} metalness={0.16} />
          <Box pos={[2.7, 0.2, 0] as V3} size={[0.24, 0.42, 0.82]} color="#262923" roughness={0.46} metalness={0.16} />
        </group>
      ))}
      {[[-34, -7], [-34, 9], [34, -8], [34, 8]].map(([px, pz], i) => (
        <group key={`fountain-lamp-${i}`} position={[px, 0, pz]}>
          <Cyl pos={[0, 2.35, 0] as V3} rt={0.08} rb={0.12} h={4.7} segs={10} color="#f2f0de" roughness={0.36} />
          <mesh position={[0, 4.8, 0]} castShadow>
            <sphereGeometry args={[0.48, 14, 10]} />
            <meshStandardMaterial color="#fff7d4" emissive="#f1d978" emissiveIntensity={0.35} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <Text position={[0, 0.24, waterD / 2 + 1.2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.35} color="#6b6047" anchorX="center" anchorY="middle">
        PETCH FOUNTAIN
      </Text>
    </group>
  );
}

function CentralQuad() {
  return (
    <group>
      <Slab pos={[20, terrainHeight(20, 38) + 0.055, 38] as V3} w={280} d={230} color="#5f9b4d" h={0.05} />
      {QUAD_WALKS.map((path) => (
        <QuadWalk key={`${path.from.join(",")}-${path.to.join(",")}`} from={path.from} to={path.to} width={path.width} />
      ))}
      <PetchFountain />
    </group>
  );
}

const PARKING_LOTS: Array<{ x: number; z: number; w: number; d: number; rotation?: number; label: string; rows?: number }> = [
  { x: -248, z: -118, w: 74, d: 48, rotation: -0.08, label: "P4", rows: 8 },
  { x: -306, z: 224, w: 92, d: 48, rotation: 0.03, label: "P6", rows: 9 },
  { x: 252, z: -58, w: 70, d: 48, rotation: 0.08, label: "PC", rows: 7 },
  { x: 268, z: 148, w: 70, d: 54, rotation: -0.03, label: "PB", rows: 7 },
  { x: 104, z: 342, w: 108, d: 46, rotation: -0.02, label: "ENG", rows: 10 },
  { x: 212, z: -208, w: 72, d: 48, rotation: 0.18, label: "CS", rows: 7 },
  { x: -82, z: -222, w: 92, d: 42, rotation: -0.04, label: "BEC", rows: 9 },
];

function ParkingLot({ x, z, w, d, rotation = 0, label, rows = 7 }: { x: number; z: number; w: number; d: number; rotation?: number; label: string; rows?: number }) {
  const y = terrainHeight(x, z) + 0.08;
  const lineXs = Array.from({ length: rows }, (_, i) => -w * 0.38 + (w * 0.76 * i) / Math.max(1, rows - 1));
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} name={`Parking lot ${label}`}>
      <Slab pos={[0, 0.035, 0] as V3} w={w} d={d} color="#7d7063" h={0.07} roughness={0.96} />
      <Box pos={[0, 0.09, -d * 0.26] as V3} size={[w * 0.82, 0.022, 0.32]} color="#ded9c2" roughness={0.8} />
      <Box pos={[0, 0.09, d * 0.26] as V3} size={[w * 0.82, 0.022, 0.32]} color="#ded9c2" roughness={0.8} />
      {lineXs.map((lineX) => (
        <group key={lineX}>
          <Box pos={[lineX, 0.1, -d * 0.26] as V3} size={[0.24, 0.024, d * 0.28]} color="#ded9c2" roughness={0.8} />
          <Box pos={[lineX, 0.1, d * 0.26] as V3} size={[0.24, 0.024, d * 0.28]} color="#ded9c2" roughness={0.8} />
        </group>
      ))}
      <Text position={[-w * 0.38, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={4.2} color="#e2dbc2" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function ParkingLots() {
  return (
    <group name="Campus parking lots">
      {PARKING_LOTS.map((lot) => (
        <ParkingLot key={lot.label} {...lot} />
      ))}
    </group>
  );
}

const LAMP_POSTS: Array<[number, number]> = [
  [198, 88],
  [168, 75],
  [120, 67],
  [72, 58],
  [22, 45],
  [-28, 38],
  [-82, 32],
  [212, 112],
  [245, 114],
  [18, -40],
  [18, 8],
  [18, 92],
  [18, 138],
  [146, -48],
  [124, -12],
  [-300, 24],
  [-335, 78],
  [-155, 112],
  [-145, -145],
  [-52, -112],
  [78, -160],
  [106, -186],
  [264, -104],
  [310, -82],
  [386, -34],
  [184, 188],
  [222, 210],
  [118, 236],
  [-96, 246],
  [42, 312],
  [108, 360],
  [166, 332],
  [184, -322],
  [122, -296],
];

const BENCHES: Array<[number, number, number]> = [
  [196, 114, 0.05],
  [234, 115, 0.05],
  [68, 58, Math.PI / 2],
  [-32, 56, Math.PI / 2],
  [30, 112, 0],
  [112, 28, -0.55],
  [8, -22, 0],
  [156, 98, Math.PI / 2],
  [214, 100, Math.PI / 2],
  [246, 100, Math.PI / 2],
  [142, 58, 0.1],
  [92, 46, -0.2],
  [28, 68, Math.PI / 2],
  [-80, 56, Math.PI / 2],
  [-154, 112, 0],
  [-286, 48, 0.2],
  [-332, 72, -0.2],
  [84, -32, 0],
  [176, -116, 0],
  [266, -94, -0.2],
  [300, -86, 0.35],
  [186, 204, Math.PI / 2],
  [232, 204, Math.PI / 2],
  [34, 310, 0.15],
  [142, 332, -0.1],
];

const BIKE_RACKS: Array<{ x: number; z: number; rotation: number; slots?: number; bikes?: number; label?: string }> = [
  { x: 68, z: -174, rotation: Math.PI / 2, slots: 8, bikes: 5, label: "Campus Bike Centre" },
  { x: 114, z: -178, rotation: Math.PI / 2, slots: 7, bikes: 4 },
  { x: 204, z: 107, rotation: Math.PI / 2, slots: 6, bikes: 4 },
  { x: 258, z: 102, rotation: Math.PI / 2, slots: 5, bikes: 3 },
  { x: 166, z: -128, rotation: 0, slots: 6, bikes: 3 },
  { x: 260, z: -91, rotation: -0.12, slots: 6, bikes: 4 },
  { x: 52, z: 304, rotation: Math.PI / 2, slots: 7, bikes: 4 },
  { x: 208, z: 196, rotation: 0, slots: 5, bikes: 3 },
  { x: -262, z: 46, rotation: Math.PI / 2, slots: 5, bikes: 2 },
  { x: -142, z: 116, rotation: 0, slots: 5, bikes: 3 },
];

const BUSH_CLUSTERS: Array<{ x: number; z: number; count: number; spread: number; color?: string }> = [
  { x: 82, z: -30, count: 18, spread: 18, color: "#496f32" },
  { x: 105, z: -50, count: 16, spread: 14, color: "#3f6630" },
  { x: 222, z: 112, count: 18, spread: 20, color: "#4a7436" },
  { x: 270, z: 104, count: 12, spread: 15, color: "#426a34" },
  { x: 176, z: -96, count: 16, spread: 16, color: "#54723a" },
  { x: -154, z: 116, count: 18, spread: 20, color: "#4c7038" },
  { x: -318, z: 66, count: 18, spread: 24, color: "#466b33" },
  { x: -122, z: 252, count: 14, spread: 18, color: "#587c3a" },
  { x: 44, z: 318, count: 16, spread: 18, color: "#456d34" },
  { x: 218, z: 202, count: 12, spread: 14, color: "#53743a" },
  { x: 288, z: -108, count: 14, spread: 16, color: "#4c7136" },
];

const TRASH_CANS: Array<[number, number]> = [
  [206, 103],
  [248, 103],
  [166, 70],
  [64, 58],
  [-30, 58],
  [18, 104],
  [82, -32],
  [176, -124],
  [266, -92],
  [-154, 116],
  [-286, 48],
  [32, 310],
  [220, 204],
];

const WAYFINDING_SIGNS: Array<{ x: number; z: number; text: string; rotation?: number }> = [
  { x: 188, z: 100, text: "LIB / QUAD", rotation: Math.PI / 2 },
  { x: 36, z: 42, text: "QUAD", rotation: 0 },
  { x: 130, z: -64, text: "CLE / FPH", rotation: 0 },
  { x: 260, z: -108, text: "SUB", rotation: -0.15 },
  { x: 72, z: -176, text: "BIKE CENTRE", rotation: Math.PI / 2 },
  { x: 130, z: 236, text: "SCIENCE", rotation: -0.2 },
  { x: 76, z: 324, text: "ENGINEERING", rotation: Math.PI / 2 },
  { x: -286, z: 36, text: "HSD / FINE ARTS", rotation: Math.PI / 2 },
];

const SCULPTURES: Array<{ x: number; z: number; kind: "stone" | "ring" | "steel" | "totem"; rotation?: number }> = [
  { x: 74, z: -24, kind: "totem", rotation: -0.15 },
  { x: 103, z: -24, kind: "totem", rotation: 0.12 },
  { x: 246, z: 112, kind: "stone", rotation: 0.5 },
  { x: 58, z: 24, kind: "ring", rotation: -0.2 },
  { x: 276, z: -88, kind: "steel", rotation: 0.35 },
  { x: -336, z: 68, kind: "steel", rotation: -0.4 },
  { x: 112, z: 326, kind: "ring", rotation: 0.2 },
];

const SERVICE_CLUTTER: Array<{ x: number; z: number; rotation?: number }> = [
  { x: 300, z: 126, rotation: -0.1 },
  { x: 230, z: -212, rotation: 0.2 },
  { x: -214, z: -128, rotation: -0.15 },
  { x: 134, z: 350, rotation: 0.08 },
  { x: -304, z: 210, rotation: 0.04 },
];

function LampPost({ x, z }: { x: number; z: number }) {
  const y = terrainHeight(x, z) + 0.06;
  return (
    <group position={[x, y, z]}>
      <Cyl pos={[0, 2.2, 0] as V3} rt={0.09} rb={0.14} h={4.4} segs={10} color="#252820" roughness={0.44} metalness={0.25} />
      <mesh position={[0, 4.55, 0]} castShadow>
        <sphereGeometry args={[0.38, 14, 10]} />
        <meshStandardMaterial color="#f3e7b6" emissive="#f2d36e" emissiveIntensity={0.55} roughness={0.24} />
      </mesh>
    </group>
  );
}

function Bench({ x, z, rotation }: { x: number; z: number; rotation: number }) {
  const y = terrainHeight(x, z) + 0.08;
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      <Box pos={[0, 0.48, 0] as V3} size={[4.1, 0.22, 0.85]} color="#8b653e" roughness={0.62} />
      <Box pos={[0, 1.08, -0.45] as V3} size={[4.1, 0.22, 0.22]} color="#7d5734" roughness={0.62} />
      <Box pos={[-1.55, 0.22, 0] as V3} size={[0.22, 0.44, 0.72]} color="#272b25" roughness={0.5} metalness={0.18} />
      <Box pos={[1.55, 0.22, 0] as V3} size={[0.22, 0.44, 0.72]} color="#272b25" roughness={0.5} metalness={0.18} />
    </group>
  );
}

function Bike({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0.28, z]}>
      <mesh position={[-0.58, 0.44, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.34, 0.035, 8, 18]} />
        <meshStandardMaterial color="#1e2226" roughness={0.42} metalness={0.25} />
      </mesh>
      <mesh position={[0.58, 0.44, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.34, 0.035, 8, 18]} />
        <meshStandardMaterial color="#1e2226" roughness={0.42} metalness={0.25} />
      </mesh>
      <Box pos={[0, 0.62, 0] as V3} size={[1.05, 0.07, 0.08]} color={color} roughness={0.38} metalness={0.16} />
      <Box pos={[-0.16, 0.86, 0] as V3} size={[0.12, 0.42, 0.08]} color={color} roughness={0.38} metalness={0.16} />
      <Box pos={[0.44, 0.86, 0] as V3} size={[0.1, 0.52, 0.08]} color={color} roughness={0.38} metalness={0.16} />
      <Box pos={[0.56, 1.16, 0] as V3} size={[0.55, 0.06, 0.08]} color="#202529" roughness={0.38} metalness={0.2} />
    </group>
  );
}

function BikeRack({ x, z, rotation, slots = 5, bikes = 2, label }: { x: number; z: number; rotation: number; slots?: number; bikes?: number; label?: string }) {
  const y = terrainHeight(x, z) + 0.08;
  const colors = ["#2f6f9f", "#b84937", "#e0b34f", "#566b55", "#7d74a8"];
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} name={label ?? "Bike rack"}>
      <Slab pos={[0, 0.025, 0] as V3} w={slots * 1.8 + 2.2} d={4.6} color="#8d8879" h={0.05} roughness={0.92} />
      {Array.from({ length: slots }).map((_, i) => {
        const px = (i - (slots - 1) / 2) * 1.65;
        return (
          <group key={i}>
            <Cyl pos={[px - 0.32, 0.6, -0.15] as V3} rt={0.045} rb={0.045} h={1.2} segs={8} color="#aeb6b8" roughness={0.3} metalness={0.55} />
            <Cyl pos={[px + 0.32, 0.6, -0.15] as V3} rt={0.045} rb={0.045} h={1.2} segs={8} color="#aeb6b8" roughness={0.3} metalness={0.55} />
            <Box pos={[px, 1.2, -0.15] as V3} size={[0.72, 0.08, 0.08]} color="#aeb6b8" roughness={0.3} metalness={0.55} />
            {i < bikes && <Bike x={px} z={0.85 + (i % 2) * 0.34} color={colors[i % colors.length]} />}
          </group>
        );
      })}
      {label && (
        <Text position={[0, 0.12, -2.25]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.15} color="#f3eed8" anchorX="center" anchorY="middle">
          {label}
        </Text>
      )}
    </group>
  );
}

function BushCluster({ x, z, count, spread, color = "#4a7436" }: { x: number; z: number; count: number; spread: number; color?: string }) {
  return (
    <group name="Native shrub cluster">
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * 2.39996;
        const radius = spread * (0.15 + ((i * 37) % 100) / 130);
        const px = x + Math.cos(angle) * radius;
        const pz = z + Math.sin(angle) * radius * 0.72;
        const scale = 0.75 + (i % 5) * 0.12;
        return (
          <mesh key={i} position={[px, terrainHeight(px, pz) + 0.45 * scale, pz]} scale={[1.25 * scale, 0.72 * scale, 1.05 * scale]} castShadow receiveShadow>
            <icosahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color={i % 4 === 0 ? "#638640" : color} roughness={0.92} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function TrashCan({ x, z }: { x: number; z: number }) {
  const y = terrainHeight(x, z) + 0.08;
  return (
    <group position={[x, y, z]}>
      <Cyl pos={[0, 0.45, 0] as V3} rt={0.32} rb={0.36} h={0.9} segs={12} color="#27342c" roughness={0.52} metalness={0.12} />
      <Cyl pos={[0, 0.94, 0] as V3} rt={0.38} rb={0.38} h={0.08} segs={12} color="#202820" roughness={0.45} metalness={0.18} />
      <Box pos={[0, 0.66, 0.34] as V3} size={[0.38, 0.18, 0.035]} color="#d7d0a0" roughness={0.55} />
    </group>
  );
}

function WayfindingSign({ x, z, text, rotation = 0 }: { x: number; z: number; text: string; rotation?: number }) {
  const y = terrainHeight(x, z) + 0.08;
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      <Cyl pos={[0, 1.15, 0] as V3} rt={0.08} rb={0.1} h={2.3} segs={8} color="#2c3029" metalness={0.2} />
      <Box pos={[0, 2.2, 0.08] as V3} size={[3.2, 0.95, 0.16]} color="#284a37" roughness={0.5} />
      <Text position={[0, 2.22, 0.19]} fontSize={0.34} color="#f0ebcc" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#132018">
        {text}
      </Text>
    </group>
  );
}

function CampusSculpture({ x, z, kind, rotation = 0 }: { x: number; z: number; kind: "stone" | "ring" | "steel" | "totem"; rotation?: number }) {
  const y = terrainHeight(x, z) + 0.08;
  if (kind === "totem") {
    return (
      <group position={[0, y, 0]} rotation={[0, rotation, 0]} name="First Peoples House carved post">
        <TotemPole x={x} z={z} h={9.5} />
      </group>
    );
  }

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} name="Campus sculpture">
      <Cyl pos={[0, 0.16, 0] as V3} rt={1.3} rb={1.55} h={0.32} segs={18} color="#777160" roughness={0.72} />
      {kind === "stone" && (
        <>
          <mesh position={[-0.28, 1.45, 0]} scale={[0.85, 1.45, 0.6]} castShadow>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color="#8d8a80" roughness={0.86} flatShading />
          </mesh>
          <mesh position={[0.78, 0.95, 0.26]} scale={[0.52, 0.9, 0.48]} castShadow>
            <dodecahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color="#6d7168" roughness={0.86} flatShading />
          </mesh>
        </>
      )}
      {kind === "ring" && (
        <mesh position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0.18, 0]} castShadow>
          <torusGeometry args={[1.25, 0.16, 12, 32]} />
          <meshStandardMaterial color="#a78b54" roughness={0.42} metalness={0.28} />
        </mesh>
      )}
      {kind === "steel" && (
        <>
          <Box pos={[-0.48, 1.35, 0] as V3} size={[0.22, 2.5, 0.22]} color="#a7aba8" roughness={0.26} metalness={0.55} />
          <Box pos={[0.35, 1.75, 0] as V3} size={[0.22, 3.2, 0.22]} color="#8a9290" roughness={0.26} metalness={0.55} />
          <Box pos={[0, 2.55, 0] as V3} size={[1.7, 0.22, 0.22]} color="#c2b674" roughness={0.36} metalness={0.34} />
        </>
      )}
    </group>
  );
}

function ServiceClutter({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  const y = terrainHeight(x, z) + 0.08;
  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} name="Campus service clutter">
      <Box pos={[0, 0.42, 0] as V3} size={[2.8, 0.84, 1.5]} color="#4e5c54" roughness={0.74} />
      <Box pos={[-2.0, 0.34, 0.2] as V3} size={[1.1, 0.68, 1.1]} color="#76776d" roughness={0.8} />
      <Cyl pos={[1.9, 0.46, -0.15] as V3} rt={0.34} rb={0.34} h={0.92} segs={10} color="#39483c" roughness={0.55} />
      <Box pos={[0.3, 0.9, 0.82] as V3} size={[1.0, 0.08, 0.16]} color="#d5cf9c" roughness={0.6} />
    </group>
  );
}

function PathsideLamps() {
  const lamps = useMemo(() => {
    const generated: Array<[number, number]> = [];
    CAMPUS_PATHS.forEach((path, pathIndex) => {
      const [x1, z1] = path.from;
      const [x2, z2] = path.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const steps = Math.max(0, Math.floor(length / 72));
      const nx = -dz / (length || 1);
      const nz = dx / (length || 1);
      for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1);
        const side = (i + pathIndex) % 2 === 0 ? 1 : -1;
        const px = THREE.MathUtils.lerp(x1, x2, t) + nx * side * (path.width * 0.5 + 3.2);
        const pz = THREE.MathUtils.lerp(z1, z2, t) + nz * side * (path.width * 0.5 + 3.2);
        if (!isInsideBuildingFootprint(px, pz)) generated.push([px, pz]);
      }
    });
    return generated;
  }, []);

  return (
    <>
      {lamps.map(([x, z], i) => (
        <LampPost key={`path-lamp-${i}`} x={x} z={z} />
      ))}
    </>
  );
}

function CampusDetails() {
  return (
    <group name="First-person campus details">
      <PathsideLamps />
      {LAMP_POSTS.map(([x, z]) => (
        <LampPost key={`${x}-${z}`} x={x} z={z} />
      ))}
      {BENCHES.map(([x, z, rotation]) => (
        <Bench key={`${x}-${z}`} x={x} z={z} rotation={rotation} />
      ))}
      {BIKE_RACKS.map((rack) => (
        <BikeRack key={`${rack.x}-${rack.z}`} {...rack} />
      ))}
      {BUSH_CLUSTERS.map((cluster) => (
        <BushCluster key={`${cluster.x}-${cluster.z}`} {...cluster} />
      ))}
      {TRASH_CANS.map(([x, z]) => (
        <TrashCan key={`${x}-${z}`} x={x} z={z} />
      ))}
      {WAYFINDING_SIGNS.map((sign) => (
        <WayfindingSign key={`${sign.x}-${sign.z}`} {...sign} />
      ))}
      {SCULPTURES.map((sculpture) => (
        <CampusSculpture key={`${sculpture.x}-${sculpture.z}-${sculpture.kind}`} {...sculpture} />
      ))}
      {SERVICE_CLUTTER.map((clutter) => (
        <ServiceClutter key={`${clutter.x}-${clutter.z}`} {...clutter} />
      ))}
    </group>
  );
}

function distanceToSegment(x: number, z: number, from: [number, number], to: [number, number]) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lengthSq = dx * dx + dz * dz || 1;
  const t = THREE.MathUtils.clamp(((x - x1) * dx + (z - z1) * dz) / lengthSq, 0, 1);
  return Math.hypot(x - (x1 + dx * t), z - (z1 + dz * t));
}

function isInsideBuildingFootprint(x: number, z: number) {
  return BUILDINGS.some((building) => {
    const [bx, bz] = buildingPosition(building);
    const rotation = buildingRotation(building);
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const dx = x - bx;
    const dz = z - bz;
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    return Math.abs(localX) < building.fw * 0.5 + 8 && Math.abs(localZ) < building.fd * 0.5 + 8;
  });
}

function isNearWalkway(x: number, z: number) {
  return [...CAMPUS_PATHS, ...QUAD_WALKS].some((path) => distanceToSegment(x, z, path.from, path.to) < path.width * 0.5 + 5.5);
}

function isInOpenQuad(x: number, z: number) {
  return x > -132 && x < 176 && z > -90 && z < 162;
}

function canPlaceTree(x: number, z: number) {
  return !isInsideBuildingFootprint(x, z) && !isNearWalkway(x, z) && !isInOpenQuad(x, z);
}

function Forest() {
  const trees = useMemo(() => {
    const data: Array<{ x: number; z: number; scale: number; kind: "conifer" | "broadleaf"; color: string }> = [];
    const add = (x: number, z: number, scale: number, kind: "conifer" | "broadleaf", color: string) => {
      if (canPlaceTree(x, z)) data.push({ x, z, scale, kind, color });
    };

    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * Math.PI * 2;
      const jitter = Math.sin(i * 12.9898) * 43758.5453;
      const r = 322 + (jitter - Math.floor(jitter) - 0.5) * 68;
      add(Math.cos(a) * r, Math.sin(a) * r, 1.15 + (i % 6) * 0.12, "conifer", "#1f5124");
    }
    for (let i = 0; i < 72; i++) {
      add(105 + (i % 12) * 22, -145 - Math.floor(i / 12) * 24 + Math.sin(i) * 5, 1.05 + (i % 5) * 0.1, "conifer", "#1e5222");
    }
    for (let i = 0; i < 70; i++) {
      add(-355 + (i % 10) * 23, -115 + Math.floor(i / 10) * 30 + Math.cos(i) * 7, 0.95 + (i % 4) * 0.12, i % 5 === 0 ? "broadleaf" : "conifer", i % 5 === 0 ? "#4a7a30" : "#204d24");
    }
    for (let i = 0; i < 58; i++) {
      add(-100 + (i % 15) * 24, 310 + Math.floor(i / 15) * 28, 1.2 + (i % 5) * 0.12, "conifer", "#214f28");
    }
    for (let i = 0; i < 34; i++) {
      add(-120 + (i % 9) * 30, -80 + Math.floor(i / 9) * 24, 0.85 + (i % 4) * 0.08, "broadleaf", "#4a7a30");
    }

    return data;
  }, []);

  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={[0, terrainHeight(tree.x, tree.z) + 0.02, 0]}>
          <Tree {...tree} />
        </group>
      ))}
    </group>
  );
}

export function World() {
  return (
    <group>
      <Ground />
      <RingRoad />
      <Pathways />
      <CentralQuad />
      <ParkingLots />
      {SHOW_PLACEMENT_CALIBRATION && <PlacementCalibrationOverlay />}
      <CoreAcademicBuildings />
      <EngineeringCluster />
      <ScienceBuildings />
      <StudentLifeBuildings />
      <ResidenceCluster />
      <AthleticsArea />
      <SpecialStructures />
      <CampusDetails />
      <Forest />
    </group>
  );
}
