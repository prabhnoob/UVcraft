import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { RemotePlayer } from "./multiplayer";

function PlayerAvatar({ player }: { player: RemotePlayer }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(player.x, player.y - 0.82, player.z), []);
  const color = useMemo(() => {
    let hash = 0;
    for (const char of player.id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
    return `hsl(${hash}, 70%, 58%)`;
  }, [player.id]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    target.set(player.x, player.y - 0.82, player.z);
    groupRef.current.position.lerp(target, Math.min(1, delta * 12));
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, player.yaw, Math.min(1, delta * 10));
  });

  return (
    <group ref={groupRef} position={[player.x, player.y - 0.82, player.z]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.42, 1.2, 5, 12]} />
        <meshStandardMaterial color={color} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.98, -0.18]} castShadow>
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshStandardMaterial color="#ead6b8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.98, -0.52]}>
        <boxGeometry args={[0.16, 0.08, 0.16]} />
        <meshStandardMaterial color="#141414" roughness={0.45} />
      </mesh>
      <Billboard position={[0, 1.8, 0]}>
        <Text fontSize={0.42} color="#f4f0d5" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#10200e">
          {player.name}
        </Text>
      </Billboard>
    </group>
  );
}

export function RemotePlayers({ players }: { players: RemotePlayer[] }) {
  return (
    <>
      {players.map((player) => (
        <PlayerAvatar key={player.id} player={player} />
      ))}
    </>
  );
}
