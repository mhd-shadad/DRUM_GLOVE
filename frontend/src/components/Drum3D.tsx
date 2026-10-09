import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGloveStore } from '../store/useGloveStore';
import { playDrumSound } from '../utils/drumAudio';

export type DrumMeshStyleType = 'particle_top' | 'particles' | 'wireframe' | 'holographic' | 'solid' | 'matrix';
export type DrumCameraViewType = 'isometric' | 'drummer' | 'audience' | 'top';

// Cyber Color Palettes for 3D Studio Kit
const THEME_COLORS: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
  wireframe: string;
  shell: string;
  head: string;
  cymbal: string;
  particles: string;
  hardware: string;
  glow: string;
}> = {
  particle_top: {
    primary: '#00f0ff',
    secondary: '#ffaa00',
    accent: '#00ff88',
    wireframe: '#00f0ff',
    shell: '#060d17',
    head: '#0b1928',
    cymbal: '#ff9900',
    particles: '#00f0ff',
    hardware: '#334155',
    glow: '#00f0ff',
  },
  particles: {
    primary: '#00f0ff',
    secondary: '#ffb46b',
    accent: '#00ffaa',
    wireframe: '#00f0ff',
    shell: '#0a1522',
    head: '#0e1f30',
    cymbal: '#ffaa44',
    particles: '#00f0ff',
    hardware: '#4a5568',
    glow: '#00f0ff',
  },
  wireframe: {
    primary: '#35c3ff',
    secondary: '#ffb46b',
    accent: '#7af0c4',
    wireframe: '#35c3ff',
    shell: '#0d131d',
    head: '#1b2838',
    cymbal: '#ffb46b',
    particles: '#35c3ff',
    hardware: '#4a5568',
    glow: '#35c3ff',
  },
  holographic: {
    primary: '#00f0ff',
    secondary: '#c792ea',
    accent: '#00ffaa',
    wireframe: '#00f0ff',
    shell: '#081c2e',
    head: '#0e2b44',
    cymbal: '#e087ff',
    particles: '#00f0ff',
    hardware: '#254b6d',
    glow: '#00f0ff',
  },
  solid: {
    primary: '#ffb46b',
    secondary: '#35c3ff',
    accent: '#ff5370',
    wireframe: '#ffb46b',
    shell: '#1a1c23',
    head: '#2d313d',
    cymbal: '#e5a04e',
    particles: '#ffb46b',
    hardware: '#64748b',
    glow: '#ffb46b',
  },
  matrix: {
    primary: '#00ff66',
    secondary: '#33ff99',
    accent: '#88ff00',
    wireframe: '#00ff66',
    shell: '#05180b',
    head: '#0b2914',
    cymbal: '#66ff99',
    particles: '#00ff66',
    hardware: '#1e4827',
    glow: '#00ff66',
  },
};

// Vibrant Color Themes for the 4 Separated Particle Drums
const TOP_DOWN_DRUM_COLORS = {
  kick: {
    name: 'KICK DRUM',
    primary: '#ff5500',
    glow: '#ffaa00',
    particles: '#ff8800',
    core: '#fff3c4',
    shockwave: '#ffaa00',
  },
  snare: {
    name: 'SNARE DRUM',
    primary: '#00f0ff',
    glow: '#38bdf8',
    particles: '#00d2ff',
    core: '#e0f2fe',
    shockwave: '#00f0ff',
  },
  closed_hihat: {
    name: 'CLOSED HI-HAT',
    primary: '#00ff88',
    glow: '#7af0c4',
    particles: '#00e676',
    core: '#dcfce7',
    shockwave: '#00ff88',
  },
  open_hihat: {
    name: 'OPEN HI-HAT',
    primary: '#ff007f',
    glow: '#ff40a0',
    particles: '#e024c3',
    core: '#fce7f3',
    shockwave: '#ff0088',
  },
};

// Helper: Particle Buffer Geometry for Circular Drumheads
const createCircleParticleGeometry = (radius: number, count: number = 320) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const r = radius * Math.sqrt(u);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(theta);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper: Swirling Spiral Particle Vortex Geometry
const createVortexParticleGeometry = (radius: number, count: number = 520) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const r = radius * Math.pow(u, 0.6);
    const spiral = r * 3.8;
    const theta = Math.random() * Math.PI * 2 + spiral;
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(theta);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper: Outer Shimmering Orbital Halo Geometry
const createOrbitalHaloGeometry = (innerR: number, outerR: number, count: number = 300) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = innerR + (outerR - innerR) * Math.random();
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(theta);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// Helper: Particle Buffer Geometry for Cylindrical Drum Shells
const createCylinderShellParticleGeometry = (radius: number, height: number, count: number = 320) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * height;
    const r = radius + (Math.random() - 0.5) * 0.02;
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
};

// =========================================================================
// EXPANDING SHOCKWAVE & PARTICLE BURST ON HIT
// =========================================================================
const ShockwaveRing: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  trigger: number;
  radius?: number;
}> = ({ position, rotation = [0, 0, 0], color, trigger, radius = 0.6 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const opacityRef = useRef(0);

  useEffect(() => {
    if (trigger > 0) {
      scaleRef.current = 1.0;
      opacityRef.current = 1.0;
    }
  }, [trigger]);

  useFrame((_, delta) => {
    if (opacityRef.current > 0.01) {
      scaleRef.current += delta * 4.8;
      opacityRef.current = Math.max(0, opacityRef.current - delta * 3.5);

      if (meshRef.current) {
        meshRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = opacityRef.current;
        }
      }
    } else if (meshRef.current && meshRef.current.scale.x !== 0.001) {
      meshRef.current.scale.set(0.001, 0.001, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={[0.001, 0.001, 1]}>
      <ringGeometry args={[radius * 0.94, radius * 1.06, 40]} />
      <meshBasicMaterial
        color={color}
        transparent={true}
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Hit Spark Particles Burst System
const SparkBurst: React.FC<{
  color: string;
  trigger: number;
  radius: number;
}> = ({ color, trigger, radius }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 48;
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = useMemo(() => {
    const v = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      v.push({
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
        z: (Math.random() - 0.5) * 0.8,
      });
    }
    return v;
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const lifeRef = useRef(0);

  useEffect(() => {
    if (trigger > 0) {
      lifeRef.current = 1.0;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * radius * 0.5;
        posAttr.setXYZ(i, r * Math.cos(theta), r * Math.sin(theta), 0.01);
      }
      posAttr.needsUpdate = true;
    }
  }, [trigger, geo, count, radius]);

  useFrame((_, delta) => {
    if (lifeRef.current > 0.01) {
      lifeRef.current = Math.max(0, lifeRef.current - delta * 3.6);
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const cx = posAttr.getX(i);
        const cy = posAttr.getY(i);
        const cz = posAttr.getZ(i);
        posAttr.setXYZ(
          i,
          cx + velocities[i].x * delta * lifeRef.current,
          cy + velocities[i].y * delta * lifeRef.current,
          cz + velocities[i].z * delta * lifeRef.current
        );
      }
      posAttr.needsUpdate = true;
      if (pointsRef.current) {
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        if (mat) mat.opacity = lifeRef.current * 0.95;
      }
    } else if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      if (mat) mat.opacity = 0;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo} position={[0, 0, 0.02]}>
      <pointsMaterial
        size={0.065}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// =========================================================================
// TOP-DOWN SEPARATED VIBRANT PARTICLE DRUM PAD COMPONENT
// Sleek glowing particle discs with vortices, halos, shockwaves & sparks
// =========================================================================
interface TopDownPadProps {
  position: [number, number, number];
  radius: number;
  colors: typeof TOP_DOWN_DRUM_COLORS.kick;
  isHit: boolean;
  onHit: () => void;
}

const TopDownParticlePad: React.FC<TopDownPadProps> = ({
  position,
  radius,
  colors,
  isHit,
  onHit,
}) => {
  const [hovered, setHovered] = useState(false);
  const hitIntensity = useRef(0);
  const vortexRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Group>(null);
  const vortexGeo = useMemo(() => createVortexParticleGeometry(radius * 0.92, 520), [radius]);
  const haloGeo = useMemo(() => createOrbitalHaloGeometry(radius * 0.95, radius * 1.28, 300), [radius]);
  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    if (isHit) {
      hitIntensity.current = 1.0;
      setTriggerCount((c) => c + 1);
    }
  }, [isHit]);

  useFrame((_, delta) => {
    if (hitIntensity.current > 0) {
      hitIntensity.current = Math.max(0, hitIntensity.current - delta * 4.2);
    }
    if (vortexRef.current) {
      // Swirling vortex animation
      vortexRef.current.rotation.z += delta * (0.45 + hitIntensity.current * 2.2);
    }
    if (haloRef.current) {
      // Counter-rotating outer halo
      haloRef.current.rotation.z -= delta * (0.2 + hitIntensity.current * 1.2);
    }
  });

  const glowStrength = Math.max(hitIntensity.current, hovered ? 0.65 : 0.0);

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Invisible Interactive Click Plane */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <circleGeometry args={[radius * 1.25, 36]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Dark Translucent Glass Chassis Underlay for Depth */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[radius * 0.98, 40]} />
        <meshStandardMaterial
          color="#05080e"
          roughness={0.25}
          metalness={0.85}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 1: Swirling Particle Vortex Core */}
      <group ref={vortexRef}>
        <points geometry={vortexGeo}>
          <pointsMaterial
            size={glowStrength > 0.1 ? 0.062 : 0.044}
            color={glowStrength > 0.1 ? colors.core : colors.particles}
            transparent
            opacity={glowStrength > 0.1 ? 1.0 : 0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Layer 2: Counter-Rotating Shimmering Particle Constellation Halo */}
      <group ref={haloRef}>
        <points geometry={haloGeo}>
          <pointsMaterial
            size={glowStrength > 0.1 ? 0.052 : 0.036}
            color={colors.glow}
            transparent
            opacity={glowStrength > 0.1 ? 0.95 : 0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Layer 3: Glowing Neon Outer Rim Ring */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[radius * 0.96, radius * 1.04, 48]} />
        <meshStandardMaterial
          color={glowStrength > 0.1 ? '#ffffff' : colors.primary}
          emissive={colors.glow}
          emissiveIntensity={glowStrength * 4.5 + 1.4}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 4: Concentric Orbiting Grid Circle */}
      <lineSegments position={[0, 0, 0.015]}>
        <edgesGeometry args={[new THREE.CircleGeometry(radius * 0.52, 32)]} />
        <lineBasicMaterial
          color={colors.glow}
          transparent
          opacity={glowStrength > 0.1 ? 1.0 : 0.65}
        />
      </lineSegments>

      {/* Layer 5: Expanding Sonic Shockwave on Hit */}
      <ShockwaveRing
        position={[0, 0, 0.02]}
        color={colors.shockwave}
        trigger={triggerCount}
        radius={radius}
      />

      {/* Layer 6: Dynamic Particle Sparks Explosion on Hit */}
      <SparkBurst
        color={colors.core}
        trigger={triggerCount}
        radius={radius}
      />
    </group>
  );
};

// =========================================================================
// TOP-DOWN SEPARATED VIBRANT PARTICLE DRUMS SCENE (Curved Single Line)
// Drums arranged in a single horizontal curved arc with clear spacing
// =========================================================================
const TopDownParticleDrumsScene: React.FC = () => {
  const { lastHit, activePads, triggerTestNote, rh, lh, settings } = useGloveStore();

  const handleHit = (note: number) => {
    triggerTestNote(note);
    playDrumSound(note);
  };

  // Flex Sensor Bend Highlights
  const isF1Active = rh.f1 > settings.flex1_threshold || lh.f1 > settings.flex1_threshold || (rh.bend?.f1 > 15);
  const isF2Active = rh.f2 > settings.flex2_threshold || lh.f2 > settings.flex2_threshold || (rh.bend?.f2 > 15);
  const isF3Active = rh.f3 > settings.flex3_threshold || lh.f3 > settings.flex3_threshold || (rh.bend?.f3 > 15);
  const isOpenHatActive =
    (lh.connected && lh.f1 > settings.flex1_threshold) ||
    (rh.bend?.f4 > 20) ||
    (lh.bend?.f1 > 15) ||
    (rh.f4 > settings.flex4_threshold);

  const isRecentHit = (note: number) =>
    !!activePads[note] || (lastHit?.note === note && Date.now() - lastHit.timestamp < 180);

  // Subtle curved guide spline line points
  const curvePoints = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.2, -0.04, 0.45),
      new THREE.Vector3(-2.65, -0.04, 0.28),
      new THREE.Vector3(-0.90, -0.04, -0.15),
      new THREE.Vector3(0.90, -0.04, -0.15),
      new THREE.Vector3(2.65, -0.04, 0.28),
      new THREE.Vector3(3.2, -0.04, 0.45),
    ]);
    return curve.getPoints(50);
  }, []);

  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const mat = new THREE.LineBasicMaterial({
      color: '#00f0ff',
      transparent: true,
      opacity: 0.25,
    });
    return new THREE.Line(geo, mat);
  }, [curvePoints]);

  return (
    <group position={[0, 0, 0]}>
      {/* Subtle Glowing Cyber Arc Guide Track */}
      <primitive object={lineObject} />

      {/* 1. CLOSED HI-HAT (Far Left - Vibrant Acid Emerald Green) */}
      <TopDownParticlePad
        position={[-2.65, 0, 0.28]}
        radius={0.68}
        colors={TOP_DOWN_DRUM_COLORS.closed_hihat}
        isHit={isRecentHit(42) || isF3Active}
        onHit={() => handleHit(42)}
      />

      {/* 2. SNARE DRUM (Center Left - Vibrant Laser Cyan) */}
      <TopDownParticlePad
        position={[-0.90, 0, -0.15]}
        radius={0.74}
        colors={TOP_DOWN_DRUM_COLORS.snare}
        isHit={isRecentHit(38) || isRecentHit(39) || isF2Active}
        onHit={() => handleHit(38)}
      />

      {/* 3. KICK DRUM (Center Right - Vibrant Solar Blaze Orange Gold) */}
      <TopDownParticlePad
        position={[0.90, 0, -0.15]}
        radius={0.80}
        colors={TOP_DOWN_DRUM_COLORS.kick}
        isHit={isRecentHit(36) || isF1Active}
        onHit={() => handleHit(36)}
      />

      {/* 4. OPEN HI-HAT (Far Right - Vibrant Cosmic Magenta / Hot Violet Pink) */}
      <TopDownParticlePad
        position={[2.65, 0, 0.28]}
        radius={0.72}
        colors={TOP_DOWN_DRUM_COLORS.open_hihat}
        isHit={isRecentHit(46) || isOpenHatActive}
        onHit={() => handleHit(46)}
      />
    </group>
  );
};

// =========================================================================
// 3D STUDIO DRUM KIT COMPONENTS (Standard 3D View)
// =========================================================================
interface DrumHeadProps {
  radius: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  isHit: boolean;
  style: DrumMeshStyleType;
  colorTheme: typeof THEME_COLORS['particles'];
  onHit: () => void;
}

const DrumHead: React.FC<DrumHeadProps> = ({
  radius,
  position,
  rotation = [0, 0, 0],
  isHit,
  style,
  colorTheme,
  onHit,
}) => {
  const [hovered, setHovered] = useState(false);
  const hitIntensity = useRef(0);
  const headMeshRef = useRef<THREE.Mesh>(null);
  const particleGeo = useMemo(() => createCircleParticleGeometry(radius * 0.94, 260), [radius]);
  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    if (isHit) {
      hitIntensity.current = 1.0;
      setTriggerCount((c) => c + 1);
    }
  }, [isHit]);

  useFrame((_, delta) => {
    if (hitIntensity.current > 0) {
      hitIntensity.current = Math.max(0, hitIntensity.current - delta * 4.5);
    }

    if (headMeshRef.current) {
      const mat = headMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        const targetGlow = hitIntensity.current > 0.05
          ? colorTheme.secondary
          : hovered
          ? colorTheme.primary
          : '#000000';
        mat.emissive.set(targetGlow);
        mat.emissiveIntensity = hitIntensity.current * 3.0 + (hovered ? 0.6 : 0.0);
      }
    }
  });

  const isParticleMode = style === 'particles' || style === 'particle_top';

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={headMeshRef}
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <circleGeometry args={[radius * 0.96, 36]} />
        <meshStandardMaterial
          color={colorTheme.head}
          roughness={0.2}
          metalness={0.4}
          wireframe={style === 'wireframe' || style === 'matrix'}
          transparent={true}
          opacity={style === 'holographic' ? 0.75 : 0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isParticleMode && (
        <points geometry={particleGeo} position={[0, 0, 0.01]}>
          <pointsMaterial
            size={hitIntensity.current > 0.1 ? 0.05 : 0.036}
            color={hitIntensity.current > 0.1 ? '#ffffff' : colorTheme.particles}
            transparent={true}
            opacity={hitIntensity.current > 0.1 ? 0.95 : 0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[radius * 0.96, radius * 1.06, 36]} />
        <meshStandardMaterial
          color={hovered || hitIntensity.current > 0.1 ? colorTheme.secondary : colorTheme.primary}
          emissive={hovered || hitIntensity.current > 0.1 ? colorTheme.secondary : colorTheme.primary}
          emissiveIntensity={hitIntensity.current * 3.2 + 0.8}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      <ShockwaveRing
        position={[0, 0, 0.03]}
        color={colorTheme.secondary}
        trigger={triggerCount}
        radius={radius}
      />
    </group>
  );
};

// Helper: Cymbal Component
interface CymbalProps {
  radius: number;
  position: [number, number, number];
  tilt?: [number, number, number];
  isHit: boolean;
  style: DrumMeshStyleType;
  colorTheme: typeof THEME_COLORS['particles'];
  onHit: () => void;
  isOpenState?: boolean;
}

const CymbalMesh: React.FC<CymbalProps> = ({
  radius,
  position,
  tilt = [0.15, 0, 0],
  isHit,
  style,
  colorTheme,
  onHit,
  isOpenState = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const hitIntensity = useRef(0);
  const wobbleTime = useRef(0);
  const particleGeo = useMemo(() => createCircleParticleGeometry(radius * 0.92, 240), [radius]);
  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    if (isHit) {
      hitIntensity.current = 1.0;
      wobbleTime.current = 0;
      setTriggerCount((c) => c + 1);
    }
  }, [isHit]);

  useFrame((_, delta) => {
    if (hitIntensity.current > 0) {
      wobbleTime.current += delta;
      hitIntensity.current = Math.max(0, hitIntensity.current - delta * 2.8);

      if (groupRef.current) {
        const wobbleX = Math.sin(wobbleTime.current * 28) * hitIntensity.current * (isOpenState ? 0.22 : 0.14);
        const wobbleZ = Math.cos(wobbleTime.current * 22) * hitIntensity.current * (isOpenState ? 0.16 : 0.1);
        groupRef.current.rotation.x = tilt[0] + wobbleX;
        groupRef.current.rotation.z = tilt[2] + wobbleZ;
      }
    } else if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tilt[0], 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tilt[2], 0.1);
    }
  });

  const isParticleMode = style === 'particles' || style === 'particle_top';

  return (
    <group position={position}>
      <group
        ref={groupRef}
        rotation={tilt}
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <mesh position={[0, isOpenState ? 0.05 : 0.02, 0]}>
          <cylinderGeometry args={[radius * 0.22, radius, 0.045, 36, 1, true]} />
          <meshStandardMaterial
            color={hovered || hitIntensity.current > 0.1 ? colorTheme.secondary : colorTheme.cymbal}
            emissive={hovered || hitIntensity.current > 0.1 ? colorTheme.secondary : colorTheme.cymbal}
            emissiveIntensity={hitIntensity.current * 2.8 + (hovered ? 0.8 : 0.35)}
            roughness={0.15}
            metalness={0.92}
            wireframe={style === 'wireframe' || style === 'matrix'}
            side={THREE.DoubleSide}
            transparent={style === 'holographic'}
            opacity={style === 'holographic' ? 0.85 : 1}
          />
        </mesh>

        <mesh position={[0, isOpenState ? 0.09 : 0.06, 0]}>
          <sphereGeometry args={[radius * 0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={colorTheme.secondary}
            emissive={colorTheme.secondary}
            emissiveIntensity={hitIntensity.current * 3.2 + 0.6}
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>

        {isParticleMode && (
          <group position={[0, isOpenState ? 0.05 : 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <points geometry={particleGeo}>
              <pointsMaterial
                size={hitIntensity.current > 0.1 ? 0.048 : 0.034}
                color={hitIntensity.current > 0.1 ? '#ffffff' : colorTheme.secondary}
                transparent={true}
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </points>
          </group>
        )}

        <mesh position={[0, isOpenState ? -0.06 : -0.02, 0]}>
          <cylinderGeometry args={[radius * 0.22, radius, 0.035, 32, 1, true]} />
          <meshStandardMaterial color={colorTheme.cymbal} metalness={0.9} roughness={0.2} />
        </mesh>

        <ShockwaveRing
          position={[0, isOpenState ? 0.05 : 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={colorTheme.secondary}
          trigger={triggerCount}
          radius={radius}
        />
      </group>

      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.2, 12]} />
        <meshStandardMaterial color={colorTheme.hardware} metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Helper: Full Kick Drum with Shell and Hardware
const KickDrum: React.FC<{
  position: [number, number, number];
  isHit: boolean;
  style: DrumMeshStyleType;
  colorTheme: typeof THEME_COLORS['particles'];
  onHit: () => void;
}> = ({ position, isHit, style, colorTheme, onHit }) => {
  const beaterRef = useRef<THREE.Group>(null);
  const kickIntensity = useRef(0);
  const shellParticleGeo = useMemo(() => createCylinderShellParticleGeometry(1.06, 1.15, 340), []);

  useEffect(() => {
    if (isHit) {
      kickIntensity.current = 1.0;
    }
  }, [isHit]);

  useFrame((_, delta) => {
    if (kickIntensity.current > 0) {
      kickIntensity.current = Math.max(0, kickIntensity.current - delta * 5.0);
      if (beaterRef.current) {
        beaterRef.current.rotation.x = THREE.MathUtils.lerp(0.55, -0.1, kickIntensity.current);
      }
    } else if (beaterRef.current) {
      beaterRef.current.rotation.x = THREE.MathUtils.lerp(beaterRef.current.rotation.x, 0.55, 0.15);
    }
  });

  const isParticleMode = style === 'particles' || style === 'particle_top';

  return (
    <group position={position}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[1.05, 1.05, 1.18, 36, 1, true]} />
          <meshStandardMaterial
            color={colorTheme.shell}
            roughness={0.25}
            metalness={0.8}
            wireframe={style === 'wireframe' || style === 'matrix'}
            transparent={true}
            opacity={style === 'holographic' ? 0.6 : 0.95}
            side={THREE.DoubleSide}
          />
        </mesh>

        <lineSegments>
          <edgesGeometry args={[new THREE.CylinderGeometry(1.055, 1.055, 1.18, 16, 1)]} />
          <lineBasicMaterial color={colorTheme.wireframe} transparent opacity={0.65} />
        </lineSegments>

        {isParticleMode && (
          <points geometry={shellParticleGeo}>
            <pointsMaterial
              size={0.038}
              color={kickIntensity.current > 0.1 ? '#ffffff' : colorTheme.particles}
              transparent={true}
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        )}

        <DrumHead
          radius={1.05}
          position={[0, -0.59, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          isHit={isHit}
          style={style}
          colorTheme={colorTheme}
          onHit={onHit}
        />

        <DrumHead
          radius={1.05}
          position={[0, 0.59, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          isHit={isHit}
          style={style}
          colorTheme={colorTheme}
          onHit={onHit}
        />

        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 1.07;
          const z = Math.sin(angle) * 1.07;
          return (
            <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.04, 1.0, 0.04]} />
              <meshStandardMaterial color={colorTheme.hardware} metalness={0.9} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      {[-1, 1].map((side, idx) => (
        <group key={idx} position={[side * 1.02, -0.55, -0.2]}>
          <mesh rotation={[0, 0, side * 0.45]}>
            <cylinderGeometry args={[0.03, 0.03, 0.85, 12]} />
            <meshStandardMaterial color={colorTheme.hardware} metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[side * 0.35, -0.38, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <group position={[0, -0.85, 0.65]}>
        <mesh position={[0, 0.02, 0.25]}>
          <boxGeometry args={[0.3, 0.04, 0.55]} />
          <meshStandardMaterial color="#1a1c23" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 0.25]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[0.22, 0.03, 0.45]} />
          <meshStandardMaterial color={colorTheme.primary} metalness={0.9} roughness={0.2} />
        </mesh>
        <group ref={beaterRef} position={[0, 0.38, 0]} rotation={[0.55, 0, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
            <meshStandardMaterial color="#e6e8ee" metalness={0.95} />
          </mesh>
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
            <meshStandardMaterial color={colorTheme.secondary} emissive={colorTheme.secondary} emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// Helper: Hardware Tripod Stand
const HardwareTripod: React.FC<{
  position: [number, number, number];
  height: number;
  colorTheme: typeof THEME_COLORS['particles'];
}> = ({ position, height, colorTheme }) => {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.03, height, 16]} />
        <meshStandardMaterial color={colorTheme.hardware} metalness={0.9} roughness={0.2} />
      </mesh>
      {Array.from({ length: 3 }).map((_, idx) => {
        const angle = (idx / 3) * Math.PI * 2;
        return (
          <group key={idx} rotation={[0, angle, 0]}>
            <mesh position={[0.22, 0.15, 0]} rotation={[0, 0, -0.6]}>
              <cylinderGeometry args={[0.02, 0.02, 0.55, 12]} />
              <meshStandardMaterial color={colorTheme.hardware} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// =========================================================================
// 3D STUDIO DRUM SET SCENE (4-Piece Kit)
// =========================================================================
const Studio4DrumKitScene: React.FC<{ drumMeshStyle: DrumMeshStyleType }> = ({ drumMeshStyle }) => {
  const { lastHit, activePads, triggerTestNote, rh, lh, settings } = useGloveStore();
  const theme = THEME_COLORS[drumMeshStyle] || THEME_COLORS.particles;

  const handleHit = (note: number) => {
    triggerTestNote(note);
    playDrumSound(note);
  };

  const isF1Active = rh.f1 > settings.flex1_threshold || lh.f1 > settings.flex1_threshold || (rh.bend?.f1 > 15);
  const isF2Active = rh.f2 > settings.flex2_threshold || lh.f2 > settings.flex2_threshold || (rh.bend?.f2 > 15);
  const isF3Active = rh.f3 > settings.flex3_threshold || lh.f3 > settings.flex3_threshold || (rh.bend?.f3 > 15);
  const isOpenHatActive =
    (lh.connected && lh.f1 > settings.flex1_threshold) ||
    (rh.bend?.f4 > 20) ||
    (lh.bend?.f1 > 15) ||
    (rh.f4 > settings.flex4_threshold);

  const isRecentHit = (note: number) =>
    !!activePads[note] || (lastHit?.note === note && Date.now() - lastHit.timestamp < 180);

  return (
    <group position={[0, -0.15, 0]}>
      {/* 1. Kick Drum */}
      <KickDrum
        position={[0, 0.1, 0.2]}
        isHit={isRecentHit(36) || isF1Active}
        style={drumMeshStyle}
        colorTheme={theme}
        onHit={() => handleHit(36)}
      />

      {/* 2. Snare Drum */}
      <group position={[-1.15, 0.32, 0.85]}>
        <HardwareTripod position={[0, -1.2, 0]} height={1.2} colorTheme={theme} />
        <group rotation={[0.16, 0.12, -0.08]}>
          <mesh>
            <cylinderGeometry args={[0.66, 0.66, 0.44, 36, 1, true]} />
            <meshStandardMaterial
              color={theme.shell}
              roughness={0.2}
              metalness={0.85}
              wireframe={drumMeshStyle === 'wireframe' || drumMeshStyle === 'matrix'}
              transparent={true}
              opacity={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.665, 0.665, 0.44, 18, 1)]} />
            <lineBasicMaterial color={theme.wireframe} transparent opacity={0.7} />
          </lineSegments>
          <DrumHead
            radius={0.66}
            position={[0, 0.22, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            isHit={isRecentHit(38) || isRecentHit(39) || isF2Active}
            style={drumMeshStyle}
            colorTheme={theme}
            onHit={() => handleHit(38)}
          />
          <DrumHead
            radius={0.66}
            position={[0, -0.22, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            isHit={false}
            style={drumMeshStyle}
            colorTheme={theme}
            onHit={() => handleHit(38)}
          />
        </group>
      </group>

      {/* 3. Closed Hi-Hat */}
      <group position={[-1.75, 0.88, 0.75]}>
        <HardwareTripod position={[0, -1.75, 0]} height={1.75} colorTheme={theme} />
        <mesh position={[0, -0.85, 0.25]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[0.18, 0.025, 0.4]} />
          <meshStandardMaterial color={theme.primary} metalness={0.9} />
        </mesh>
        <CymbalMesh
          radius={0.62}
          position={[0, 0, 0]}
          tilt={[0.06, 0, 0]}
          isHit={isRecentHit(42) || isF3Active}
          style={drumMeshStyle}
          colorTheme={theme}
          onHit={() => handleHit(42)}
          isOpenState={false}
        />
      </group>

      {/* 4. Open Hi-Hat */}
      <group position={[1.35, 1.05, 0.65]}>
        <HardwareTripod position={[0, -1.95, 0]} height={1.95} colorTheme={theme} />
        <CymbalMesh
          radius={0.66}
          position={[0, 0, 0]}
          tilt={[0.18, -0.08, 0.05]}
          isHit={isRecentHit(46) || isOpenHatActive}
          style={drumMeshStyle}
          colorTheme={theme}
          onHit={() => handleHit(46)}
          isOpenState={true}
        />
      </group>

      {/* Drummer Throne */}
      <group position={[0, -0.45, 1.95]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.12, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.6, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// =========================================================================
// Main Exported Scene Router
// =========================================================================
export interface DrumKitSceneProps {
  drumMeshStyle: DrumMeshStyleType;
  cameraView?: DrumCameraViewType;
}

export const DrumKitScene: React.FC<DrumKitSceneProps> = ({ drumMeshStyle, cameraView = 'top' }) => {
  const { camera } = useThree();

  // Dynamic Camera Position Transitions
  useEffect(() => {
    let targetPos = new THREE.Vector3(0, 5.8, 0.05);
    let lookTarget = new THREE.Vector3(0, 0, 0);

    if (drumMeshStyle === 'particle_top' || cameraView === 'top') {
      targetPos = new THREE.Vector3(0, 5.8, 0.05);
      lookTarget = new THREE.Vector3(0, 0, 0);
    } else if (cameraView === 'drummer') {
      targetPos = new THREE.Vector3(0, 1.45, 2.25);
      lookTarget = new THREE.Vector3(0, 0.4, 0.1);
    } else if (cameraView === 'audience') {
      targetPos = new THREE.Vector3(0, 1.3, -3.6);
      lookTarget = new THREE.Vector3(0, 0.4, 0.3);
    } else {
      // isometric
      targetPos = new THREE.Vector3(2.8, 2.4, 3.2);
      lookTarget = new THREE.Vector3(0, 0.35, 0.3);
    }

    camera.position.lerp(targetPos, 0.95);
    camera.lookAt(lookTarget);
  }, [drumMeshStyle, cameraView, camera]);

  return (
    <>
      {drumMeshStyle === 'particle_top' ? (
        <TopDownParticleDrumsScene />
      ) : (
        <Studio4DrumKitScene drumMeshStyle={drumMeshStyle} />
      )}
    </>
  );
};

// =========================================================================
// Main Exported Canvas Wrapper Component
// =========================================================================
export interface Drum3DProps {
  drumMeshStyle?: DrumMeshStyleType;
  cameraView?: DrumCameraViewType;
}

export const Drum3D: React.FC<Drum3DProps> = ({
  drumMeshStyle: propMeshStyle,
  cameraView: propCameraView,
}) => {
  const storeDrumMeshStyle = useGloveStore((s) => s.drumMeshStyle) || 'particle_top';
  const storeDrumCameraView = useGloveStore((s) => s.drumCameraView) || 'top';

  const activeMeshStyle: DrumMeshStyleType = propMeshStyle || storeDrumMeshStyle;
  const activeCameraView: DrumCameraViewType = propCameraView || storeDrumCameraView;

  const isTopDown = activeMeshStyle === 'particle_top' || activeCameraView === 'top';
  const initialCamPos: [number, number, number] = isTopDown ? [0, 5.8, 0.05] : [2.8, 2.4, 3.2];

  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-[#07090d] overflow-hidden rounded-2xl border border-cyber-border/80 shadow-2xl">
      <Canvas
        camera={{ position: initialCamPos, fov: 48 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Holographic Cyberspace Lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 9, 6]} intensity={1.5} color="#eef6ff" />
        <directionalLight position={[-6, -4, -4]} intensity={0.8} color="#35c3ff" />
        <pointLight position={[0, 4.0, 0]} intensity={1.8} color="#00f0ff" distance={12} />
        <pointLight position={[-2.5, 1.8, 1.5]} intensity={1.4} color="#00ffaa" distance={8} />
        <pointLight position={[2.5, 1.8, 1.5]} intensity={1.4} color="#ff5500" distance={8} />

        {/* The 4-Drum Set Scene */}
        <DrumKitScene drumMeshStyle={activeMeshStyle} cameraView={activeCameraView} />

        {/* Cyberpunk Grid Floor */}
        <Grid
          position={[0, -0.6, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.9}
          cellColor="#121824"
          sectionSize={2.0}
          sectionThickness={1.4}
          sectionColor="#00f0ff"
          fadeDistance={16}
          fadeStrength={1.5}
        />

        {/* Orbit Controls */}
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          minDistance={1.8}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>

      {/* Controls & Click Instruction Badge */}
      <div className="absolute bottom-3 left-4 text-[11px] font-mono text-cyber-textMuted/80 bg-[#07090d]/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyber-border/60 pointer-events-none flex items-center gap-2">
        <span className="text-cyber-cyan font-bold">VIBRANT PARTICLE DRUMS:</span> Kick • Snare • Closed HH • Open HH
      </div>
    </div>
  );
};

export default Drum3D;
