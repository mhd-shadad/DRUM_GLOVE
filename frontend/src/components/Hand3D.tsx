import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGloveStore } from '../store/useGloveStore';

// Helper to generate particle positions sampled inside/on a tapered cylinder (human finger phalanx)
const createTaperedCylinderParticleGeometry = (
  radiusTop: number,
  radiusBottom: number,
  length: number,
  count: number = 260
) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const yRatio = Math.random(); // 0 at base, 1 at tip
    const currentRadius = radiusBottom + (radiusTop - radiusBottom) * yRatio;
    const u = Math.random();
    const r = currentRadius * Math.sqrt(u);
    const theta = Math.random() * Math.PI * 2;
    const y = yRatio * length;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper to generate particle positions sampled inside an ellipsoid (muscle pads & knuckles)
const createEllipsoidParticleGeometry = (rx: number, ry: number, rz: number, count: number = 400) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const r = Math.cbrt(u);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * rx * Math.sin(phi) * Math.cos(theta);
    const y = r * ry * Math.sin(phi) * Math.sin(theta);
    const z = r * rz * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper to generate particle positions for human palm metacarpals volume
const createHumanPalmParticleGeometry = (width: number, height: number, depth: number, count: number = 1400) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const yRatio = Math.random();
    const widthFactor = 0.82 + 0.28 * yRatio;
    const x = (Math.random() - 0.5) * width * widthFactor;
    const y = (yRatio - 0.5) * height;
    const archZ = Math.cos((x / width) * Math.PI) * 0.08;
    const z = (Math.random() - 0.5) * depth + archZ;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper to generate particle positions for an anatomical distal segment with a curved, natural fingertip
const createAnatomicalFingertipParticleGeometry = (
  radiusTop: number,
  radiusBottom: number,
  length: number,
  count: number = 320
) => {
  const positions = new Float32Array(count * 3);

  // Distribute particles: ~65% along the tapering phalanx shaft, ~35% in the curved fingertip dome
  const shaftCount = Math.floor(count * 0.65);
  const domeCount = count - shaftCount;
  const domeHeight = radiusTop * 0.92;

  // 1. Phalanx shaft tapering naturally from radiusBottom to radiusTop
  for (let i = 0; i < shaftCount; i++) {
    const yRatio = Math.random(); // 0 at joint, 1 at base of fingertip curve
    const currentRadius = radiusBottom + (radiusTop - radiusBottom) * yRatio;
    const u = Math.random();
    const r = currentRadius * Math.sqrt(u);
    const theta = Math.random() * Math.PI * 2;
    const y = yRatio * length;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta) * 0.92; // Natural slightly oval finger cross-section

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  // 2. Smooth anatomical curved fingertip dome (capping the tip smoothly to an organic rounded apex)
  for (let i = 0; i < domeCount; i++) {
    // phi: polar angle from apex (0 = apex of tip, PI/2 = base of dome at y = length)
    const phi = Math.asin(Math.random());
    const theta = Math.random() * Math.PI * 2;
    // Scale factor s fills both inner volume and defines outer contour
    const s = 0.35 + 0.65 * Math.sqrt(Math.random());

    const x = s * radiusTop * Math.sin(phi) * Math.cos(theta);
    const z = s * (radiusTop * 0.90) * Math.sin(phi) * Math.sin(theta);
    const y = length + s * domeHeight * Math.cos(phi);

    const idx = shaftCount + i;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Anatomical Human Finger Segment Component (Pure Holographic Quantum Particles)
interface QuantumFingerSegmentProps {
  length: number;
  radiusBase: number;
  radiusTip: number;
  isHit: boolean;
  glowColor?: string;
  isTip?: boolean;
  children?: React.ReactNode;
}

const QuantumFingerSegment: React.FC<QuantumFingerSegmentProps> = ({
  length,
  radiusBase,
  radiusTip,
  isHit,
  glowColor = '#00f0ff',
  isTip = false,
  children,
}) => {
  const particleGeo = useMemo(
    () =>
      isTip
        ? createAnatomicalFingertipParticleGeometry(radiusTip * 1.15, radiusBase * 1.15, length, 320)
        : createTaperedCylinderParticleGeometry(radiusTip * 1.15, radiusBase * 1.15, length, 260),
    [radiusBase, radiusTip, length, isTip]
  );
  const knuckleParticleGeo = useMemo(
    () => createEllipsoidParticleGeometry(radiusBase * 1.3, radiusBase * 1.3, radiusBase * 1.3, 110),
    [radiusBase]
  );

  const particleColor = isHit ? '#ffeedd' : glowColor;

  return (
    <group>
      {/* Phalanx Bone Quantum Particle Cloud */}
      <points geometry={particleGeo}>
        <pointsMaterial
          size={isHit ? 0.052 : 0.044}
          color={particleColor}
          transparent={true}
          opacity={isHit ? 1.0 : 0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Joint Knuckle Particle Cloud */}
      <points geometry={knuckleParticleGeo} position={[0, 0, 0]}>
        <pointsMaterial
          size={isHit ? 0.055 : 0.046}
          color={particleColor}
          transparent={true}
          opacity={isHit ? 1.0 : 0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Child joint container placed at the tip of this segment */}
      {children && <group position={[0, length, 0]}>{children}</group>}
    </group>
  );
};

// 3D Procedural Anatomical Quantum Particle Nebula Hand Model Component
interface HandModelProps {
  side: 'rh' | 'lh';
  position?: [number, number, number];
}

const HandModel: React.FC<HandModelProps> = ({ side, position = [0, -0.6, 0] }) => {
  const isHandFlashing = useGloveStore((s) => s.isHandFlashing);
  const lastHit = useGloveStore((s) => s.lastHit);
  const isHit = isHandFlashing && (!lastHit?.side || lastHit.side === side);
  const gloveState = useGloveStore((s) => s[side]);
  
  // Nebula Cyan (#00f0ff) for Right Hand, Cosmic Green/Cyan (#00ffaa) for Left Hand
  const glowColor = side === 'rh' ? '#00f0ff' : '#00ffaa';
  const particleColor = isHit ? '#ffb46b' : glowColor;

  // Geometries for Palm, Muscle Base Pads & Forearm Stem Particles
  const palmParticleGeo = useMemo(() => createHumanPalmParticleGeometry(1.5, 1.7, 0.42, 1400), []);
  const thenarParticleGeo = useMemo(() => createEllipsoidParticleGeometry(0.40, 0.58, 0.35, 480), []);
  const hypothenarParticleGeo = useMemo(() => createEllipsoidParticleGeometry(0.34, 0.50, 0.30, 360), []);
  const cuffParticleGeo = useMemo(() => createTaperedCylinderParticleGeometry(0.85, 0.72, 2.0, 650), []);

  const handGroup = useRef<THREE.Group>(null);

  // Finger Joint Refs (MCP = knuckle, PIP = middle, DIP = tip)
  const indexMCP = useRef<THREE.Group>(null);
  const indexPIP = useRef<THREE.Group>(null);
  const indexDIP = useRef<THREE.Group>(null);

  const middleMCP = useRef<THREE.Group>(null);
  const middlePIP = useRef<THREE.Group>(null);
  const middleDIP = useRef<THREE.Group>(null);

  const ringMCP = useRef<THREE.Group>(null);
  const ringPIP = useRef<THREE.Group>(null);
  const ringDIP = useRef<THREE.Group>(null);

  const pinkyMCP = useRef<THREE.Group>(null);
  const pinkyPIP = useRef<THREE.Group>(null);
  const pinkyDIP = useRef<THREE.Group>(null);

  const thumbMCP = useRef<THREE.Group>(null);
  const thumbPIP = useRef<THREE.Group>(null);

  // Complementary filter state persistent across frames
  const filterState = useRef({
    pitch: 0,
    roll: 0,
    yaw: 0,
    initialized: false,
  });

  // Mirrored X multiplier for left hand
  const sideX = side === 'lh' ? -1 : 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const { f1, f2, f3, f4, ax, ay, az, gx, gy, gz } = gloveState;

    // 1. MAP flex sensors to finger curling
    const maxCurl = Math.PI * 0.9;
    const targetIndex = (Math.max(0, Math.min(4095, f1)) / 4095) * maxCurl;
    const targetMiddle = (Math.max(0, Math.min(4095, f2)) / 4095) * maxCurl;
    const targetRing = (Math.max(0, Math.min(4095, f3)) / 4095) * maxCurl;
    const targetPinky = (Math.max(0, Math.min(4095, f4)) / 4095) * maxCurl;

    // Distribute joint curling anatomically: MCP ~45%, PIP ~35%, DIP ~20%
    const lerpJoint = (ref: React.RefObject<THREE.Group>, target: number) => {
      if (ref.current) {
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, target, 0.2);
      }
    };

    lerpJoint(indexMCP, targetIndex * 0.45);
    lerpJoint(indexPIP, targetIndex * 0.35);
    lerpJoint(indexDIP, targetIndex * 0.20);

    lerpJoint(middleMCP, targetMiddle * 0.45);
    lerpJoint(middlePIP, targetMiddle * 0.35);
    lerpJoint(middleDIP, targetMiddle * 0.20);

    lerpJoint(ringMCP, targetRing * 0.45);
    lerpJoint(ringPIP, targetRing * 0.35);
    lerpJoint(ringDIP, targetRing * 0.20);

    lerpJoint(pinkyMCP, targetPinky * 0.45);
    lerpJoint(pinkyPIP, targetPinky * 0.35);
    lerpJoint(pinkyDIP, targetPinky * 0.20);

    // Subtle natural thumb resting curl
    const thumbCurl = targetIndex * 0.3 + targetMiddle * 0.2;
    lerpJoint(thumbMCP, thumbCurl * 0.4);
    lerpJoint(thumbPIP, thumbCurl * 0.3);

    // 2. MAP IMU to hand.rotation using Complementary Filter (alpha = 0.98)
    const hasIMUData = ax !== 0 || ay !== 0 || az !== 0 || gx !== 0 || gy !== 0 || gz !== 0;

    if (hasIMUData && handGroup.current) {
      const pitchAcc = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
      const rollAcc = Math.atan2(ay, az);

      const gxRad = (gx * Math.PI) / 180;
      const gyRad = (gy * Math.PI) / 180;
      const gzRad = (gz * Math.PI) / 180;

      if (!filterState.current.initialized) {
        filterState.current.pitch = pitchAcc;
        filterState.current.roll = rollAcc;
        filterState.current.yaw = 0;
        filterState.current.initialized = true;
      }

      const alpha = 0.98;
      const newPitch = alpha * (filterState.current.pitch + gxRad * dt) + (1 - alpha) * pitchAcc;
      const newRoll = alpha * (filterState.current.roll + gyRad * dt) + (1 - alpha) * rollAcc;
      const newYaw = (filterState.current.yaw + gzRad * dt) * 0.998;

      filterState.current.pitch = newPitch;
      filterState.current.roll = newRoll;
      filterState.current.yaw = newYaw;

      handGroup.current.rotation.x = THREE.MathUtils.lerp(handGroup.current.rotation.x, newPitch, 0.2);
      handGroup.current.rotation.y = THREE.MathUtils.lerp(handGroup.current.rotation.y, newYaw, 0.2);
      handGroup.current.rotation.z = THREE.MathUtils.lerp(handGroup.current.rotation.z, newRoll, 0.2);
    } else if (handGroup.current) {
      const time = performance.now() * 0.001;
      const idlePitch = Math.sin(time * 0.8) * 0.03;
      const idleYaw = Math.cos(time * 0.5) * 0.04;
      handGroup.current.rotation.x = THREE.MathUtils.lerp(handGroup.current.rotation.x, idlePitch, 0.05);
      handGroup.current.rotation.y = THREE.MathUtils.lerp(handGroup.current.rotation.y, idleYaw, 0.05);
      handGroup.current.rotation.z = THREE.MathUtils.lerp(handGroup.current.rotation.z, 0, 0.05);
    }
  });

  return (
    <group ref={handGroup} position={position}>
      {/* ---------------- HOLOGRAPHIC QUANTUM PARTICLE PALM & STEM ---------------- */}
      <group position={[0, 0, 0]}>
        {/* Palm Metacarpal Particle Cloud */}
        <points geometry={palmParticleGeo}>
          <pointsMaterial
            size={isHit ? 0.050 : 0.045}
            color={particleColor}
            transparent={true}
            opacity={isHit ? 1.0 : 0.92}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Thenar Eminence (Thumb Muscle Base Pad) Particles */}
        <points geometry={thenarParticleGeo} position={[-0.52 * sideX, -0.28, 0.12]}>
          <pointsMaterial
            size={isHit ? 0.050 : 0.044}
            color={particleColor}
            transparent={true}
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Hypothenar Eminence (Pinky Side Muscle Pad) Particles */}
        <points geometry={hypothenarParticleGeo} position={[0.48 * sideX, -0.4, 0.08]}>
          <pointsMaterial
            size={isHit ? 0.048 : 0.042}
            color={particleColor}
            transparent={true}
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Forearm Stem Particles extending down into grid */}
        <points geometry={cuffParticleGeo} position={[0, -1.8, 0]}>
          <pointsMaterial
            size={isHit ? 0.046 : 0.040}
            color={particleColor}
            transparent={true}
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* ---------------- THUMB ---------------- */}
      <group position={[-0.78 * sideX, -0.28, 0.12]} rotation={[0.35, -0.5 * sideX, 0.75 * sideX]}>
        <group ref={thumbMCP}>
          <QuantumFingerSegment
            length={0.52}
            radiusBase={0.16}
            radiusTip={0.14}
            isHit={isHit}
            glowColor={glowColor}
          >
            <group ref={thumbPIP}>
              <QuantumFingerSegment
                length={0.42}
                radiusBase={0.14}
                radiusTip={0.10}
                isHit={isHit}
                glowColor={glowColor}
                isTip={true}
              />
            </group>
          </QuantumFingerSegment>
        </group>
      </group>

      {/* ---------------- INDEX FINGER (F1) - Natural -8° Spread ---------------- */}
      <group position={[-0.48 * sideX, 0.82, 0]} rotation={[0, 0, 0.08 * sideX]}>
        <group ref={indexMCP}>
          <QuantumFingerSegment
            length={0.60}
            radiusBase={0.135}
            radiusTip={0.115}
            isHit={isHit}
            glowColor={glowColor}
          >
            <group ref={indexPIP}>
              <QuantumFingerSegment
                length={0.46}
                radiusBase={0.115}
                radiusTip={0.10}
                isHit={isHit}
                glowColor={glowColor}
              >
                <group ref={indexDIP}>
                  <QuantumFingerSegment
                    length={0.36}
                    radiusBase={0.10}
                    radiusTip={0.085}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                  />
                </group>
              </QuantumFingerSegment>
            </group>
          </QuantumFingerSegment>
        </group>
      </group>

      {/* ---------------- MIDDLE FINGER (F2) - Longest Central Reference ---------------- */}
      <group position={[-0.16 * sideX, 0.92, 0]} rotation={[0, 0, 0]}>
        <group ref={middleMCP}>
          <QuantumFingerSegment
            length={0.68}
            radiusBase={0.14}
            radiusTip={0.12}
            isHit={isHit}
            glowColor={glowColor}
          >
            <group ref={middlePIP}>
              <QuantumFingerSegment
                length={0.50}
                radiusBase={0.12}
                radiusTip={0.105}
                isHit={isHit}
                glowColor={glowColor}
              >
                <group ref={middleDIP}>
                  <QuantumFingerSegment
                    length={0.38}
                    radiusBase={0.105}
                    radiusTip={0.09}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                  />
                </group>
              </QuantumFingerSegment>
            </group>
          </QuantumFingerSegment>
        </group>
      </group>

      {/* ---------------- RING FINGER (F3) - Natural +7° Spread ---------------- */}
      <group position={[0.17 * sideX, 0.86, 0]} rotation={[0, 0, -0.07 * sideX]}>
        <group ref={ringMCP}>
          <QuantumFingerSegment
            length={0.63}
            radiusBase={0.135}
            radiusTip={0.115}
            isHit={isHit}
            glowColor={glowColor}
          >
            <group ref={ringPIP}>
              <QuantumFingerSegment
                length={0.46}
                radiusBase={0.115}
                radiusTip={0.098}
                isHit={isHit}
                glowColor={glowColor}
              >
                <group ref={ringDIP}>
                  <QuantumFingerSegment
                    length={0.36}
                    radiusBase={0.098}
                    radiusTip={0.085}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                  />
                </group>
              </QuantumFingerSegment>
            </group>
          </QuantumFingerSegment>
        </group>
      </group>

      {/* ---------------- PINKY FINGER (F4) - Natural +16° Spread & Slim Taper ---------------- */}
      <group position={[0.48 * sideX, 0.75, 0]} rotation={[0, 0, -0.16 * sideX]}>
        <group ref={pinkyMCP}>
          <QuantumFingerSegment
            length={0.50}
            radiusBase={0.12}
            radiusTip={0.10}
            isHit={isHit}
            glowColor={glowColor}
          >
            <group ref={pinkyPIP}>
              <QuantumFingerSegment
                length={0.38}
                radiusBase={0.10}
                radiusTip={0.085}
                isHit={isHit}
                glowColor={glowColor}
              >
                <group ref={pinkyDIP}>
                  <QuantumFingerSegment
                    length={0.30}
                    radiusBase={0.085}
                    radiusTip={0.072}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                  />
                </group>
              </QuantumFingerSegment>
            </group>
          </QuantumFingerSegment>
        </group>
      </group>
    </group>
  );
};

// Main Exported Canvas Wrapper Component
export interface Hand3DProps {
  side?: 'rh' | 'lh';
  viewMode?: 'rh' | 'lh' | 'both';
}

export const Hand3D: React.FC<Hand3DProps> = ({ side, viewMode }) => {
  const storeViewMode = useGloveStore((s) => s.viewMode);
  const activeViewMode = viewMode || storeViewMode || side || 'both';

  const isBoth = activeViewMode === 'both';
  const cameraPos: [number, number, number] = isBoth ? [0, 1.3, 6.2] : [0, 1.2, 5.2];

  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-[#07090d] overflow-hidden rounded-2xl border border-cyber-border/80 shadow-2xl">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPos, fov: 45 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Holographic Quantum Cyberspace Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 5]} intensity={1.2} color="#00f0ff" distance={12} />
        <pointLight position={[-4, 4, 3]} intensity={0.9} color="#00ffaa" distance={10} />

        {/* The Holographic Quantum Particle Hand Model(s) - GLOVETONE v1.0 Style */}
        {activeViewMode === 'both' ? (
          <>
            <HandModel side="lh" position={[-1.75, -0.6, 0]} />
            <HandModel side="rh" position={[1.75, -0.6, 0]} />
          </>
        ) : (
          <HandModel side={activeViewMode === 'lh' ? 'lh' : 'rh'} position={[0, -0.6, 0]} />
        )}

        {/* Cyberpunk Grid Floor */}
        <Grid
          position={[0, -2.8, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.9}
          cellColor="#121824"
          sectionSize={2.0}
          sectionThickness={1.4}
          sectionColor="#00f0ff"
          fadeDistance={14}
          fadeStrength={1.5}
        />

        {/* Orbit Controls */}
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          minDistance={2.5}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 + 0.15}
        />
      </Canvas>

      {/* Orbit Controls Instruction Badge */}
      <div className="absolute bottom-3 left-4 text-[11px] font-mono text-cyber-textMuted/70 bg-[#07090d]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-cyber-border/60 pointer-events-none">
        DRAG: Rotate • SCROLL: Zoom • RIGHT-CLICK: Pan
      </div>
    </div>
  );
};

export default Hand3D;
