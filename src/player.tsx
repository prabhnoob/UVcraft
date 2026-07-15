import { useEffect, useMemo, useRef } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BUILDINGS, buildingPosition, buildingRotation } from "./geo";
import { mobileInput } from "./mobileInput";
import { sendPlayerUpdate } from "./multiplayer";
import { terrainHeight } from "./terrain";

const EYE_HEIGHT = 1.72;
const WALK_SPEED = 7.5;
const SPRINT_SPEED = 12.5;
const JUMP_SPEED = 6.4;
const GRAVITY = 19;
const PLAYER_RADIUS = 1.15;
const WORLD_LIMIT = 470;
const TOUCH_LOOK_SENSITIVITY = 0.0032;
const MIN_PITCH = -Math.PI * 0.48;
const MAX_PITCH = Math.PI * 0.48;

const walkableBuildings = new Set(["McPherson Library", "Mearns Centre (Library wing)"]);

type CollisionBox = {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  cos: number;
  sin: number;
};

function makeCollisionBoxes(): CollisionBox[] {
  return BUILDINGS.filter((building) => !walkableBuildings.has(building.name)).map((building) => {
    const [x, z] = buildingPosition(building);
    const rotation = buildingRotation(building);
    return {
      x,
      z,
      halfW: building.fw * 0.5 + PLAYER_RADIUS,
      halfD: building.fd * 0.5 + PLAYER_RADIUS,
      cos: Math.cos(-rotation),
      sin: Math.sin(-rotation),
    };
  });
}

function isBlocked(x: number, z: number, boxes: CollisionBox[]) {
  if (Math.abs(x) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) return true;

  return boxes.some((box) => {
    const dx = x - box.x;
    const dz = z - box.z;
    const localX = dx * box.cos - dz * box.sin;
    const localZ = dx * box.sin + dz * box.cos;
    return Math.abs(localX) < box.halfW && Math.abs(localZ) < box.halfD;
  });
}

export function FirstPersonPlayer() {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const keys = useRef<Record<string, boolean>>({});
  const velocityY = useRef(0);
  const grounded = useRef(false);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);
  const cameraEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const syncTimer = useRef(0);
  const boxes = useMemo(makeCollisionBoxes, []);

  useEffect(() => {
    const spawnX = 72;
    const spawnZ = 122;
    camera.position.set(spawnX, terrainHeight(spawnX, spawnZ) + EYE_HEIGHT, spawnZ);
    camera.lookAt(225, terrainHeight(225, 78) + 5, 78);

    const onKeyDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const locked = (controlsRef.current as { isLocked?: boolean } | null)?.isLocked;
    const touchActive = mobileInput.active;

    if (!locked && touchActive && (mobileInput.lookX !== 0 || mobileInput.lookY !== 0)) {
      cameraEuler.setFromQuaternion(camera.quaternion);
      cameraEuler.y -= mobileInput.lookX * TOUCH_LOOK_SENSITIVITY;
      cameraEuler.x = THREE.MathUtils.clamp(cameraEuler.x - mobileInput.lookY * TOUCH_LOOK_SENSITIVITY, MIN_PITCH, MAX_PITCH);
      camera.quaternion.setFromEuler(cameraEuler);
      mobileInput.lookX = 0;
      mobileInput.lookY = 0;
    }

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    move.set(0, 0, 0);
    if (locked || touchActive) {
      if (keys.current.KeyW || keys.current.ArrowUp) move.add(forward);
      if (keys.current.KeyS || keys.current.ArrowDown) move.sub(forward);
      if (keys.current.KeyD || keys.current.ArrowRight) move.add(right);
      if (keys.current.KeyA || keys.current.ArrowLeft) move.sub(right);
      if (touchActive) {
        move.addScaledVector(forward, mobileInput.moveY);
        move.addScaledVector(right, mobileInput.moveX);
      }
      if (move.lengthSq() > 0) move.normalize();

      if (grounded.current && (keys.current.Space || mobileInput.jump)) {
        velocityY.current = JUMP_SPEED;
        grounded.current = false;
        mobileInput.jump = false;
      }
    }

    const touchSprint = touchActive && Math.hypot(mobileInput.moveX, mobileInput.moveY) > 0.86;
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight || touchSprint ? SPRINT_SPEED : WALK_SPEED;
    const targetX = camera.position.x + move.x * speed * dt;
    const targetZ = camera.position.z + move.z * speed * dt;
    let nextX = camera.position.x;
    let nextZ = camera.position.z;

    if (!isBlocked(targetX, targetZ, boxes)) {
      nextX = targetX;
      nextZ = targetZ;
    } else {
      if (!isBlocked(targetX, nextZ, boxes)) nextX = targetX;
      if (!isBlocked(nextX, targetZ, boxes)) nextZ = targetZ;
    }

    velocityY.current -= GRAVITY * dt;
    const groundY = terrainHeight(nextX, nextZ) + EYE_HEIGHT;
    let nextY = camera.position.y + velocityY.current * dt;

    if (nextY <= groundY) {
      nextY = groundY;
      velocityY.current = 0;
      grounded.current = true;
    } else {
      grounded.current = false;
    }

    camera.position.set(nextX, nextY, nextZ);

    syncTimer.current += dt;
    if (syncTimer.current >= 0.08) {
      syncTimer.current = 0;
      cameraEuler.setFromQuaternion(camera.quaternion);
      sendPlayerUpdate({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        yaw: cameraEuler.y,
        pitch: cameraEuler.x,
      });
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
