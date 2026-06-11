import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import "./App.css";
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

      <Canvas camera={{ position: [72, 4, 122], fov: 72, near: 0.05, far: 5000 }} shadows gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
