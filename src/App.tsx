import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { useRef, useState } from "react";
import "./App.css";
import { mobileInput } from "./mobileInput";
import { World } from "./world";
import { FirstPersonPlayer } from "./player";

function Scene() {
  return (
    <>
      <ambientLight intensity={0.55} color="#c8d8ff" />
      <directionalLight
        position={[280, 430, 180]}
        intensity={1.35}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={2000}
        shadow-camera-left={-700}
        shadow-camera-right={700}
        shadow-camera-top={700}
        shadow-camera-bottom={-700}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-160, 220, -90]} intensity={0.26} color="#c8d8ff" />
      <hemisphereLight args={["#b0d0ff", "#4a7a30", 0.32]} />
      <Sky sunPosition={[100, 30, 70]} rayleigh={0.8} turbidity={4} mieCoefficient={0.003} mieDirectionalG={0.92} />
      <World />
      <FirstPersonPlayer />
    </>
  );
}

const JOYSTICK_RADIUS = 54;

function TouchControls() {
  const movePointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const moveOrigin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const setMove = (clientX: number, clientY: number) => {
    const dx = clientX - moveOrigin.current.x;
    const dy = clientY - moveOrigin.current.y;
    const distance = Math.min(Math.hypot(dx, dy), JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    setStick({ x, y });
    mobileInput.moveX = x / JOYSTICK_RADIUS;
    mobileInput.moveY = -y / JOYSTICK_RADIUS;
    mobileInput.active = true;
  };

  return (
    <div className="touch-controls" aria-label="Touch movement controls">
      <div
        className="touch-joystick"
        onPointerDown={(event) => {
          movePointer.current = event.pointerId;
          moveOrigin.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
          setMove(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (movePointer.current === event.pointerId) setMove(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (movePointer.current !== event.pointerId) return;
          movePointer.current = null;
          mobileInput.moveX = 0;
          mobileInput.moveY = 0;
          setStick({ x: 0, y: 0 });
        }}
        onPointerCancel={() => {
          movePointer.current = null;
          mobileInput.moveX = 0;
          mobileInput.moveY = 0;
          setStick({ x: 0, y: 0 });
        }}
      >
        <div className="touch-joystick-thumb" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
      </div>

      <div
        className="touch-look-pad"
        onPointerDown={(event) => {
          lookPointer.current = event.pointerId;
          lastLook.current = { x: event.clientX, y: event.clientY };
          mobileInput.active = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (lookPointer.current !== event.pointerId) return;
          mobileInput.lookX += event.clientX - lastLook.current.x;
          mobileInput.lookY += event.clientY - lastLook.current.y;
          lastLook.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          if (lookPointer.current === event.pointerId) lookPointer.current = null;
        }}
        onPointerCancel={() => {
          lookPointer.current = null;
        }}
      />

      <button
        className="touch-jump"
        type="button"
        aria-label="Jump"
        onPointerDown={(event) => {
          mobileInput.active = true;
          mobileInput.jump = true;
          event.preventDefault();
        }}
      >
        Jump
      </button>
    </div>
  );
}

export default function App() {
  return (
    <div className="game-screen">
      <div className="brand-hud">
        <div className="brand-title">UVCraft</div>
        <div className="brand-subtitle">University of Victoria campus walk</div>
        <div className="brand-note">Click campus to enter walk mode - Esc releases cursor</div>
      </div>

      <div className="play-hud">
        <div className="play-hud-title">Explore Mode</div>
        <div className="play-hud-objective">McPherson Library - Quad - Clearihue</div>
        <div className="hud-stat">
          <span>Terrain</span>
          <strong>Irregular</strong>
        </div>
        <div className="hud-stat">
          <span>Scale</span>
          <strong>1 unit = 1 m</strong>
        </div>
        <div className="hud-keys">
          <span>WASD</span>
          <span>Shift</span>
          <span>Space</span>
        </div>
      </div>

      <div className="crosshair" />
      <TouchControls />

      <Canvas camera={{ position: [72, 4, 122], fov: 72, near: 0.05, far: 5000 }} shadows gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
