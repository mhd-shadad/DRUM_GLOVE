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

// Helper to create pure quad-wireframe line geometry (concentric cross-rings + longitudinal ribs, NO diagonal triangle slashes)
const createQuadCylinderLinesGeometry = (
  radiusTop: number,
  radiusBottom: number,
  length: number,
  radialSegments: number = 14,
  heightSegments: number = 6,
  isTip: boolean = false
) => {
  const linePositions: number[] = [];
  const ovalZ = 0.86;

  // 1. Horizontal cross rings
  for (let h = 0; h <= heightSegments; h++) {
    const yRatio = h / heightSegments;
    const y = yRatio * length;
    const r = radiusBottom + (radiusTop - radiusBottom) * yRatio;

    for (let k = 0; k < radialSegments; k++) {
      const th1 = (k / radialSegments) * Math.PI * 2;
      const th2 = ((k + 1) / radialSegments) * Math.PI * 2;

      linePositions.push(
        r * Math.cos(th1), y, r * Math.sin(th1) * ovalZ,
        r * Math.cos(th2), y, r * Math.sin(th2) * ovalZ
      );
    }
  }

  // 2. Longitudinal vertical ribs
  for (let k = 0; k < radialSegments; k++) {
    const th = (k / radialSegments) * Math.PI * 2;
    const cosTh = Math.cos(th);
    const sinTh = Math.sin(th) * ovalZ;

    for (let h = 0; h < heightSegments; h++) {
      const y1 = (h / heightSegments) * length;
      const r1 = radiusBottom + (radiusTop - radiusBottom) * (h / heightSegments);
      const y2 = ((h + 1) / heightSegments) * length;
      const r2 = radiusBottom + (radiusTop - radiusBottom) * ((h + 1) / heightSegments);

      linePositions.push(
        r1 * cosTh, y1, r1 * sinTh,
        r2 * cosTh, y2, r2 * sinTh
      );
    }
  }

  // 3. Fingertip Anatomical Dome (converging quad rings and ribs to the tip apex)
  if (isTip) {
    const domeHeight = radiusTop * 0.92;
    const domeRings = 4;

    for (let d = 1; d <= domeRings; d++) {
      const phi = (d / domeRings) * (Math.PI / 2);
      const y = length + domeHeight * Math.sin(phi);
      const r = radiusTop * Math.cos(phi);

      if (d < domeRings) {
        for (let k = 0; k < radialSegments; k++) {
          const th1 = (k / radialSegments) * Math.PI * 2;
          const th2 = ((k + 1) / radialSegments) * Math.PI * 2;

          linePositions.push(
            r * Math.cos(th1), y, r * Math.sin(th1) * ovalZ,
            r * Math.cos(th2), y, r * Math.sin(th2) * ovalZ
          );
        }
      }

      const prevPhi = ((d - 1) / domeRings) * (Math.PI / 2);
      const yPrev = length + domeHeight * Math.sin(prevPhi);
      const rPrev = radiusTop * Math.cos(prevPhi);

      for (let k = 0; k < radialSegments; k++) {
        const th = (k / radialSegments) * Math.PI * 2;
        const cosTh = Math.cos(th);
        const sinTh = Math.sin(th) * ovalZ;

        linePositions.push(
          rPrev * cosTh, yPrev, rPrev * sinTh,
          r * cosTh, y, r * sinTh
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  return geo;
};

// Helper to create pure quad-wireframe sphere line geometry for knuckles and muscle mounds
const createQuadSphereLinesGeometry = (
  radius: number,
  radialSegments: number = 14,
  heightSegments: number = 8
) => {
  const linePositions: number[] = [];

  // Latitude rings
  for (let h = 1; h < heightSegments; h++) {
    const phi = (h / heightSegments) * Math.PI;
    const y = radius * Math.cos(phi);
    const r = radius * Math.sin(phi);

    for (let k = 0; k < radialSegments; k++) {
      const th1 = (k / radialSegments) * Math.PI * 2;
      const th2 = ((k + 1) / radialSegments) * Math.PI * 2;

      linePositions.push(
        r * Math.cos(th1), y, r * Math.sin(th1),
        r * Math.cos(th2), y, r * Math.sin(th2)
      );
    }
  }

  // Longitude meridians
  for (let k = 0; k < radialSegments; k++) {
    const th = (k / radialSegments) * Math.PI * 2;
    const cosTh = Math.cos(th);
    const sinTh = Math.sin(th);

    for (let h = 0; h < heightSegments; h++) {
      const phi1 = (h / heightSegments) * Math.PI;
      const phi2 = ((h + 1) / heightSegments) * Math.PI;

      const y1 = radius * Math.cos(phi1);
      const r1 = radius * Math.sin(phi1);
      const y2 = radius * Math.cos(phi2);
      const r2 = radius * Math.sin(phi2);

      linePositions.push(
        r1 * cosTh, y1, r1 * sinTh,
        r2 * cosTh, y2, r2 * sinTh
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  return geo;
};

// Helper to create pure quad-wireframe box line geometry for palm chassis
const createQuadBoxLinesGeometry = (
  width: number,
  height: number,
  depth: number,
  segX: number = 8,
  segY: number = 10,
  segZ: number = 3
) => {
  const linePositions: number[] = [];
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;

  // Front & Back faces (Z = +hz and Z = -hz)
  for (const z of [hz, -hz]) {
    for (let j = 0; j <= segY; j++) {
      const y = -hy + (j / segY) * height;
      for (let i = 0; i < segX; i++) {
        const x1 = -hx + (i / segX) * width;
        const x2 = -hx + ((i + 1) / segX) * width;
        linePositions.push(x1, y, z, x2, y, z);
      }
    }
    for (let i = 0; i <= segX; i++) {
      const x = -hx + (i / segX) * width;
      for (let j = 0; j < segY; j++) {
        const y1 = -hy + (j / segY) * height;
        const y2 = -hy + ((j + 1) / segY) * height;
        linePositions.push(x, y1, z, x, y2, z);
      }
    }
  }

  // Left & Right faces (X = -hx and X = +hx)
  for (const x of [-hx, hx]) {
    for (let j = 0; j <= segY; j++) {
      const y = -hy + (j / segY) * height;
      for (let k = 0; k < segZ; k++) {
        const z1 = -hz + (k / segZ) * depth;
        const z2 = -hz + ((k + 1) / segZ) * depth;
        linePositions.push(x, y, z1, x, y, z2);
      }
    }
    for (let k = 0; k <= segZ; k++) {
      const z = -hz + (k / segZ) * depth;
      for (let j = 0; j < segY; j++) {
        const y1 = -hy + (j / segY) * height;
        const y2 = -hy + ((j + 1) / segY) * height;
        linePositions.push(x, y1, z, x, y2, z);
      }
    }
  }

  // Top & Bottom faces (Y = -hy and Y = +hy)
  for (const y of [-hy, hy]) {
    for (let i = 0; i <= segX; i++) {
      const x = -hx + (i / segX) * width;
      for (let k = 0; k < segZ; k++) {
        const z1 = -hz + (k / segZ) * depth;
        const z2 = -hz + ((k + 1) / segZ) * depth;
        linePositions.push(x, y, z1, x, y, z2);
      }
    }
    for (let k = 0; k <= segZ; k++) {
      const z = -hz + (k / segZ) * depth;
      for (let i = 0; i < segX; i++) {
        const x1 = -hx + (i / segX) * width;
        const x2 = -hx + ((i + 1) / segX) * width;
        linePositions.push(x1, y, z, x2, y, z);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  return geo;
};

// Continuous sculpted anatomical human forearm and palm surface with pure quad wireframe lines and solid occluder
const createAnatomicalArmAndPalmGeometry = (sideX: number) => {
  const linePositions: number[] = [];
  const vertices: number[] = [];
  const indices: number[] = [];

  const Ny = 22; // 22 height rings from forearm base through wrist up to knuckle arch
  const Ntheta = 22; // 22 longitudinal ribs around the perimeter

  const grid: [number, number, number][][] = [];

  for (let j = 0; j <= Ny; j++) {
    const t = j / Ny;
    const ring: [number, number, number][] = [];

    // Height y: from forearm base (-2.2) to knuckle arch (+0.82)
    const y = -2.2 + t * 3.02;

    if (t <= 0.48) {
      // 1. Forearm section: from y = -2.2 tapering smoothly to wrist at y = -0.75
      const s = t / 0.48;
      const Rx = 0.82 - 0.24 * s; // 0.82 at base -> 0.58 at wrist
      const Rz = 0.64 - 0.20 * s; // 0.64 at base -> 0.44 at wrist

      for (let k = 0; k < Ntheta; k++) {
        const theta = (k / Ntheta) * Math.PI * 2;
        const x = Rx * Math.cos(theta);
        const z = Rz * Math.sin(theta);
        ring.push([x, y, z]);
      }
    } else {
      // 2. Sculpted human palm section: from wrist at y = -0.75 up to knuckle arch at y = +0.82
      const p = (t - 0.48) / 0.52; // 0 at wrist, 1 at knuckle arch
      const Rx = 0.58 + 0.16 * p; // expands from 0.58 to 0.74 (total width across knuckles ~1.48)
      const Rz = 0.44 - 0.16 * p; // tapers thickness from 0.44 down to 0.28

      for (let k = 0; k < Ntheta; k++) {
        const theta = (k / Ntheta) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        let x = Rx * cosT;
        let z = Rz * sinT;
        let curY = y;

        // Thenar muscle pad swelling (thumb base fleshy mount on thumb side)
        const isThumbSide = sideX * cosT < 0;
        if (isThumbSide && sinT > -0.3) {
          const thenarProfile = Math.exp(-Math.pow((p - 0.32) / 0.22, 2));
          const weight = Math.abs(cosT) * Math.max(0, sinT + 0.4) / 1.4;
          x -= sideX * 0.34 * thenarProfile * weight;
          z += 0.15 * thenarProfile * weight;
        }

        // Hypothenar muscle contour (pinky edge heel)
        const isPinkySide = sideX * cosT > 0;
        if (isPinkySide && sinT > -0.2) {
          const hypoProfile = Math.exp(-Math.pow((p - 0.26) / 0.18, 2));
          const weight = Math.abs(cosT) * Math.max(0, sinT + 0.3) / 1.3;
          x += sideX * 0.14 * hypoProfile * weight;
          z += 0.08 * hypoProfile * weight;
        }

        // Palmar hollow cup (anterior palm hollow)
        if (sinT > 0 && Math.abs(cosT) < 0.6) {
          const cupProfile = Math.sin(p * Math.PI);
          z -= 0.06 * cupProfile * (1 - Math.abs(cosT));
        }

        // Knuckle arch at the top edge
        if (p > 0.7) {
          const archWeight = (p - 0.7) / 0.3;
          const archOffset = 0.08 * Math.cos((x / 0.75) * (Math.PI / 2.2));
          curY += archOffset * archWeight;
        }

        ring.push([x, curY, z]);
      }
    }

    grid.push(ring);
  }

  // Pure Quad LineSegments: circumferential rings + longitudinal ribs
  for (let j = 0; j <= Ny; j++) {
    for (let k = 0; k < Ntheta; k++) {
      const p1 = grid[j][k];
      const p2 = grid[j][(k + 1) % Ntheta];
      linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    }
  }

  for (let k = 0; k < Ntheta; k++) {
    for (let j = 0; j < Ny; j++) {
      const p1 = grid[j][k];
      const p2 = grid[j + 1][k];
      linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    }
  }

  // Solid Inner Occluder Geometry: slightly inset (0.985) so backside lines are occluded
  for (let j = 0; j <= Ny; j++) {
    for (let k = 0; k < Ntheta; k++) {
      const p = grid[j][k];
      vertices.push(p[0] * 0.985, p[1], p[2] * 0.985);
    }
  }

  for (let j = 0; j < Ny; j++) {
    for (let k = 0; k < Ntheta; k++) {
      const i0 = j * Ntheta + k;
      const i1 = j * Ntheta + ((k + 1) % Ntheta);
      const i2 = (j + 1) * Ntheta + ((k + 1) % Ntheta);
      const i3 = (j + 1) * Ntheta + k;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  const linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  const solidGeo = new THREE.BufferGeometry();
  solidGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  solidGeo.setIndex(indices);
  solidGeo.computeVertexNormals();

  return { linesGeo, solidGeo };
};

type HandStyleType = 'particles' | 'anatomical' | 'hybrid' | 'wireframe' | 'triangulated' | 'solid';

// Anatomical Human Finger Segment Component supporting all 5 Cyber styles
interface FingerSegmentProps {
  length: number;
  radiusBase: number;
  radiusTip: number;
  isHit: boolean;
  glowColor?: string;
  isTip?: boolean;
  handStyle?: HandStyleType;
  children?: React.ReactNode;
}

const FingerSegment: React.FC<FingerSegmentProps> = ({
  length,
  radiusBase,
  radiusTip,
  isHit,
  glowColor = '#00f0ff',
  isTip = false,
  handStyle = 'particles',
  children,
}) => {
  // Quantum particle geometries (used by 'particles' and 'hybrid')
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

  // Memoized pure quad-line geometries for Studio Cyber Wireframe
  const quadLinesGeo = useMemo(
    () => createQuadCylinderLinesGeometry(radiusTip, radiusBase, length, 16, 6, isTip),
    [radiusTip, radiusBase, length, isTip]
  );
  const knuckleQuadLinesGeo = useMemo(
    () => createQuadSphereLinesGeometry(radiusBase * 1.15, 16, 8),
    [radiusBase]
  );

  // Studio Cyber Wireframe Color: Electric Amber (#ff9000), White-hot radiant flash (#ffffff) on hit
  const studioWireColor = isHit ? '#ffffff' : (glowColor === '#00f0ff' ? '#ff9000' : '#ffa022');
  const particleColor = isHit ? '#ffeedd' : glowColor;
  const solidColor = isHit ? '#ffeedd' : '#181d26';
  const emissiveColor = isHit ? '#ffb46b' : glowColor;

  return (
    <group>
      {/* ---------------- 1. PARTICLES STYLE ---------------- */}
      {(handStyle === 'particles' || handStyle === 'hybrid') && (
        <>
          <points geometry={particleGeo}>
            <pointsMaterial
              size={isHit ? 0.052 : 0.044}
              color={particleColor}
              transparent={true}
              opacity={isHit ? 1.0 : (handStyle === 'hybrid' ? 0.8 : 0.9)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>

          <points geometry={knuckleParticleGeo} position={[0, 0, 0]}>
            <pointsMaterial
              size={isHit ? 0.055 : 0.046}
              color={particleColor}
              transparent={true}
              opacity={isHit ? 1.0 : (handStyle === 'hybrid' ? 0.85 : 0.95)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        </>
      )}

      {/* ---------------- 2. HYBRID INNER CORE SKELETON ---------------- */}
      {handStyle === 'hybrid' && (
        <group>
          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 0.8, radiusBase * 0.8, length, 12]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>

          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[radiusBase * 0.9, 10, 10]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>

          {isTip && (
            <mesh position={[0, length, 0]} scale={[1, 0.88, 0.90]}>
              <sphereGeometry args={[radiusTip * 0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )}

      {/* ---------------- 3. SOLID CYBER CHASSIS STYLE ---------------- */}
      {handStyle === 'solid' && (
        <group>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[radiusBase * 1.15, 16, 14]} />
            <meshStandardMaterial
              color={solidColor}
              emissive={emissiveColor}
              emissiveIntensity={isHit ? 2.5 : 0.12}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 1.05, radiusBase * 1.05, length, 16]} />
            <meshStandardMaterial
              color={solidColor}
              emissive={emissiveColor}
              emissiveIntensity={isHit ? 2.0 : 0.08}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {isTip && (
            <mesh position={[0, length, 0]} scale={[1, 0.88, 0.90]}>
              <sphereGeometry args={[radiusTip * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color={solidColor}
                emissive={emissiveColor}
                emissiveIntensity={isHit ? 2.6 : 0.18}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          )}
        </group>
      )}

      {/* ---------------- 4. CYBER WIREFRAME (STUDIO REFERENCE HAND) ---------------- */}
      {handStyle === 'wireframe' && (
        <group>
          {/* Inner dark occluder body: blocks backside lines so only clean front quad lines show */}
          <mesh position={[0, length / 2, 0]} scale={[1, 1, 0.86]}>
            <cylinderGeometry args={[radiusTip * 0.99, radiusBase * 0.99, length, 20]} />
            <meshBasicMaterial color="#07090d" depthWrite={true} />
          </mesh>

          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[radiusBase * 0.99, 14, 12]} />
            <meshBasicMaterial color="#07090d" depthWrite={true} />
          </mesh>

          {isTip && (
            <mesh position={[0, length, 0]} scale={[1, 0.90, 0.86]}>
              <sphereGeometry args={[radiusTip * 0.99, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#07090d" depthWrite={true} />
            </mesh>
          )}

          {/* Pure quad-grid glowing wireframe lines */}
          <lineSegments geometry={quadLinesGeo}>
            <lineBasicMaterial
              color={studioWireColor}
              transparent={true}
              opacity={isHit ? 1.0 : 0.95}
            />
          </lineSegments>
        </group>
      )}

      {/* ---------------- 5. LOW-POLY TRIANGULATED WIREFRAME STYLE ---------------- */}
      {handStyle === 'triangulated' && (
        <group>
          <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[radiusBase * 1.25, 0]} />
            <meshStandardMaterial
              color={isHit ? '#ffeedd' : '#151a24'}
              emissive={emissiveColor}
              emissiveIntensity={isHit ? 2.0 : 0.18}
              flatShading={true}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[radiusBase * 1.26, 0]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 1.05, radiusBase * 1.05, length, 6]} />
            <meshStandardMaterial
              color={isHit ? '#ffeedd' : '#151a24'}
              emissive={emissiveColor}
              emissiveIntensity={isHit ? 1.8 : 0.15}
              flatShading={true}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 1.06, radiusBase * 1.06, length, 6]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={0.75}
            />
          </mesh>

          {isTip && (
            <>
              <mesh position={[0, length, 0]} scale={[1, 0.88, 0.90]}>
                <sphereGeometry args={[radiusTip * 1.05, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                  color={isHit ? '#ffeedd' : '#151a24'}
                  emissive={emissiveColor}
                  emissiveIntensity={isHit ? 2.2 : 0.22}
                  flatShading={true}
                  transparent={true}
                  opacity={0.85}
                />
              </mesh>
              <mesh position={[0, length, 0]} scale={[1, 0.88, 0.90]}>
                <sphereGeometry args={[radiusTip * 1.06, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshBasicMaterial
                  color={particleColor}
                  wireframe={true}
                  transparent={true}
                  opacity={0.8}
                />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* ---------------- 6. ANATOMICAL HIGH-DENSITY HUMAN WIREFRAME STYLE ---------------- */}
      {handStyle === 'anatomical' && (
        <group>
          {/* Inner anatomical muscle/bone core (provides realistic 3D depth and mass) */}
          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 1.0, radiusBase * 1.03, length, 32]} />
            <meshStandardMaterial
              color={isHit ? '#ffeedd' : '#0a1017'}
              emissive={glowColor}
              emissiveIntensity={isHit ? 1.6 : 0.12}
              transparent={true}
              opacity={0.42}
              roughness={0.5}
            />
          </mesh>

          {/* High-density phalanx contour wireframe (32 radial segments x 12 height rings) */}
          <mesh position={[0, length / 2, 0]}>
            <cylinderGeometry args={[radiusTip * 1.02, radiusBase * 1.05, length, 32, 12]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={isHit ? 1.0 : 0.85}
            />
          </mesh>

          {/* Palmar fleshy pulp pad contour on underside of the phalanx */}
          <mesh position={[0, length * 0.48, 0.03]} scale={[0.95, 0.85, 0.55]}>
            <sphereGeometry args={[radiusBase * 0.95, 24, 16]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={isHit ? 0.9 : 0.65}
            />
          </mesh>

          {/* High-density anatomical knuckle joint capsule (28 x 24 wireframe rings) */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[radiusBase * 1.14, 28, 24]} />
            <meshBasicMaterial
              color={particleColor}
              wireframe={true}
              transparent={true}
              opacity={isHit ? 1.0 : 0.9}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[radiusBase * 1.12, 18, 16]} />
            <meshStandardMaterial
              color={isHit ? '#ffeedd' : '#0c141f'}
              emissive={glowColor}
              emissiveIntensity={isHit ? 1.5 : 0.15}
              transparent={true}
              opacity={0.45}
            />
          </mesh>

          {/* High-density curved anatomical fingertip dome (smooth organic human tip) */}
          {isTip && (
            <group position={[0, length, 0]} scale={[1, 0.92, 0.90]}>
              <mesh>
                <sphereGeometry args={[radiusTip * 1.05, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshBasicMaterial
                  color={particleColor}
                  wireframe={true}
                  transparent={true}
                  opacity={isHit ? 1.0 : 0.92}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[radiusTip * 1.03, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                  color={isHit ? '#ffeedd' : '#0a1017'}
                  emissive={glowColor}
                  emissiveIntensity={isHit ? 1.8 : 0.16}
                  transparent={true}
                  opacity={0.5}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Child joint container placed at the tip of this segment */}
      {children && <group position={[0, length, 0]}>{children}</group>}
    </group>
  );
};

const QuantumFingerSegment = FingerSegment;

// 3D Procedural Anatomical Quantum Particle Nebula Hand Model Component
interface HandModelProps {
  side: 'rh' | 'lh';
  position?: [number, number, number];
  handStyle?: HandStyleType;
}

const HandModel: React.FC<HandModelProps> = ({ side, position = [0, -0.6, 0], handStyle: propStyle }) => {
  const isHandFlashing = useGloveStore((s) => s.isHandFlashing);
  const lastHit = useGloveStore((s) => s.lastHit);
  const isHit = isHandFlashing && (!lastHit?.side || lastHit.side === side);
  const gloveState = useGloveStore((s) => s[side]);
  const storeHandStyle = useGloveStore((s) => s.handStyle);
  const handStyle: HandStyleType = propStyle || storeHandStyle || 'wireframe';
  
  // Mirrored X multiplier for left hand (declared first as useMemo depends on it)
  const sideX = side === 'lh' ? -1 : 1;

  // Nebula Cyan (#00f0ff) for Right Hand, Cosmic Green/Cyan (#00ffaa) for Left Hand
  const glowColor = side === 'rh' ? '#00f0ff' : '#00ffaa';
  const particleColor = isHit ? '#ffb46b' : glowColor;

  // Geometries for Palm, Muscle Base Pads & Forearm Stem Particles
  const palmParticleGeo = useMemo(() => createHumanPalmParticleGeometry(1.5, 1.7, 0.42, 1400), []);
  const thenarParticleGeo = useMemo(() => createEllipsoidParticleGeometry(0.40, 0.58, 0.35, 480), []);
  const hypothenarParticleGeo = useMemo(() => createEllipsoidParticleGeometry(0.34, 0.50, 0.30, 360), []);
  const cuffParticleGeo = useMemo(() => createTaperedCylinderParticleGeometry(0.85, 0.72, 2.0, 650), []);

  // Unified Continuous Sculpted Anatomical Arm & Palm Mesh (No square, no cuff cylinder - pure human hand anatomy)
  const unifiedArmPalmData = useMemo(() => createAnatomicalArmAndPalmGeometry(sideX), [sideX]);

  // Studio Cyber Wireframe Color: Electric Amber (#ff9000), White-hot radiant flash (#ffffff) on hit
  const studioWireColor = isHit ? '#ffffff' : (side === 'rh' ? '#ff9000' : '#ffa022');

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
      {/* ---------------- PALM & FOREARM CHASSIS ---------------- */}
      <group position={[0, 0, 0]}>
        {/* PARTICLES & HYBRID: Quantum Particle Clouds */}
        {(handStyle === 'particles' || handStyle === 'hybrid') && (
          <>
            <points geometry={palmParticleGeo}>
              <pointsMaterial
                size={isHit ? 0.050 : 0.045}
                color={particleColor}
                transparent={true}
                opacity={isHit ? 1.0 : (handStyle === 'hybrid' ? 0.82 : 0.92)}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </points>

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
          </>
        )}

        {/* HYBRID: Translucent inner palm wireframe chassis */}
        {handStyle === 'hybrid' && (
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.4, 1.6, 0.28]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.25}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, -1.0, 0]}>
              <cylinderGeometry args={[0.70, 0.78, 0.45, 16]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.25}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}

        {/* SOLID CYBER CHASSIS PALM */}
        {handStyle === 'solid' && (
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.48, 1.68, 0.32]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#161a22'}
                emissive={isHit ? '#ffb46b' : glowColor}
                emissiveIntensity={isHit ? 2.4 : 0.08}
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>

            <mesh position={[0, 0.05, 0.18]}>
              <boxGeometry args={[1.28, 1.38, 0.06]} />
              <meshStandardMaterial
                color={isHit ? '#ffb46b' : '#222838'}
                emissive={isHit ? '#ffb46b' : glowColor}
                emissiveIntensity={isHit ? 2.0 : 0.15}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            <mesh position={[0, 0.1, 0.22]}>
              <ringGeometry args={[0.18, 0.28, 24]} />
              <meshBasicMaterial
                color={isHit ? '#ffeedd' : glowColor}
                side={THREE.DoubleSide}
              />
            </mesh>

            <mesh position={[0, -1.0, 0]}>
              <cylinderGeometry args={[0.72, 0.80, 0.45, 18]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#151820'}
                emissive={isHit ? '#ffb46b' : glowColor}
                emissiveIntensity={isHit ? 2.0 : 0.08}
                metalness={0.85}
                roughness={0.3}
              />
            </mesh>

            <mesh position={[0, -1.0, 0.41]}>
              <boxGeometry args={[1.1, 0.05, 0.02]} />
              <meshBasicMaterial color={isHit ? '#ffeedd' : glowColor} />
            </mesh>
          </group>
        )}

        {/* CYBER WIREFRAME (STUDIO REFERENCE HAND) - CONTINUOUS SCULPTED HAND & FOREARM */}
        {handStyle === 'wireframe' && (
          <group position={[0, 0, 0]}>
            {/* Solid inner occluder: hides backside lines so only front-facing vector grid shows */}
            <mesh geometry={unifiedArmPalmData.solidGeo}>
              <meshBasicMaterial color="#07090d" depthWrite={true} />
            </mesh>
            {/* Continuous flowing quad wireframe grid (forearm -> wrist -> thenar/palm -> knuckle arch) */}
            <lineSegments geometry={unifiedArmPalmData.linesGeo}>
              <lineBasicMaterial
                color={studioWireColor}
                transparent={true}
                opacity={isHit ? 1.0 : 0.95}
              />
            </lineSegments>
          </group>
        )}

        {/* LOW-POLY TRIANGULATED WIREFRAME PALM */}
        {handStyle === 'triangulated' && (
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.48, 1.68, 0.32, 2, 2, 1]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#141822'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.8 : 0.15}
                flatShading={true}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.49, 1.69, 0.33, 2, 2, 1]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.75}
              />
            </mesh>
            <mesh position={[0, 0.05, 0.18]}>
              <boxGeometry args={[1.25, 1.35, 0.06, 2, 2, 1]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#1d2331'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.5 : 0.2}
                flatShading={true}
              />
            </mesh>
            <mesh position={[0, 0.05, 0.18]}>
              <boxGeometry args={[1.26, 1.36, 0.07, 2, 2, 1]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
            <mesh position={[0, -1.0, 0]}>
              <cylinderGeometry args={[0.72, 0.80, 0.45, 8]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#161922'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.5 : 0.1}
                flatShading={true}
              />
            </mesh>
            <mesh position={[0, -1.0, 0]}>
              <cylinderGeometry args={[0.73, 0.81, 0.45, 8]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={0.75}
              />
            </mesh>
          </group>
        )}

        {/* ---------------- ANATOMICAL HIGH-DENSITY HUMAN WIREFRAME PALM ---------------- */}
        {handStyle === 'anatomical' && (
          <group position={[0, 0, 0]}>
            {/* Metacarpal Palm Chassis (28 x 28 x 8 dense wireframe grid) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.48, 1.68, 0.32, 28, 28, 8]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={isHit ? 1.0 : 0.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.46, 1.66, 0.30, 12, 12, 4]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#0a1017'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.5 : 0.12}
                transparent={true}
                opacity={0.45}
              />
            </mesh>

            {/* Thenar Muscle Mound (Thumb Base Fleshy Pad, high density 28 x 22) */}
            <mesh position={[-0.50 * sideX, -0.28, 0.14]} rotation={[0.2, 0.1 * sideX, 0.35 * sideX]} scale={[1.0, 1.35, 0.85]}>
              <sphereGeometry args={[0.38, 28, 22]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={isHit ? 1.0 : 0.85}
              />
            </mesh>
            <mesh position={[-0.50 * sideX, -0.28, 0.14]} rotation={[0.2, 0.1 * sideX, 0.35 * sideX]} scale={[0.98, 1.33, 0.83]}>
              <sphereGeometry args={[0.38, 16, 14]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#0e1622'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.6 : 0.15}
                transparent={true}
                opacity={0.45}
              />
            </mesh>

            {/* Hypothenar Muscle Mound (Pinky Heel Fleshy Pad, high density 26 x 20) */}
            <mesh position={[0.48 * sideX, -0.38, 0.10]} rotation={[-0.1, 0, -0.15 * sideX]} scale={[0.85, 1.25, 0.75]}>
              <sphereGeometry args={[0.34, 26, 20]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={isHit ? 1.0 : 0.85}
              />
            </mesh>
            <mesh position={[0.48 * sideX, -0.38, 0.10]} rotation={[-0.1, 0, -0.15 * sideX]} scale={[0.83, 1.23, 0.73]}>
              <sphereGeometry args={[0.34, 16, 14]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#0e1622'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.6 : 0.15}
                transparent={true}
                opacity={0.45}
              />
            </mesh>

            {/* Metacarpal Tendon Lines (4 anatomical tendon ridges leading to the 4 knuckles) */}
            {/* Index tendon */}
            <mesh position={[-0.24 * sideX, 0.40, 0.16]} rotation={[0, 0, 0.08 * sideX]}>
              <cylinderGeometry args={[0.045, 0.05, 0.85, 16, 6]} />
              <meshBasicMaterial color={particleColor} wireframe={true} transparent={true} opacity={0.7} />
            </mesh>
            {/* Middle tendon */}
            <mesh position={[-0.08 * sideX, 0.44, 0.16]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.052, 0.90, 16, 6]} />
              <meshBasicMaterial color={particleColor} wireframe={true} transparent={true} opacity={0.7} />
            </mesh>
            {/* Ring tendon */}
            <mesh position={[0.09 * sideX, 0.42, 0.16]} rotation={[0, 0, -0.06 * sideX]}>
              <cylinderGeometry args={[0.045, 0.05, 0.85, 16, 6]} />
              <meshBasicMaterial color={particleColor} wireframe={true} transparent={true} opacity={0.7} />
            </mesh>
            {/* Pinky tendon */}
            <mesh position={[0.26 * sideX, 0.36, 0.15]} rotation={[0, 0, -0.14 * sideX]}>
              <cylinderGeometry args={[0.042, 0.048, 0.80, 16, 6]} />
              <meshBasicMaterial color={particleColor} wireframe={true} transparent={true} opacity={0.7} />
            </mesh>

            {/* Anatomical Wrist / Carpal Base (32 x 10 wireframe rings) */}
            <mesh position={[0, -1.02, 0]}>
              <cylinderGeometry args={[0.74, 0.82, 0.52, 32, 10]} />
              <meshBasicMaterial
                color={particleColor}
                wireframe={true}
                transparent={true}
                opacity={isHit ? 1.0 : 0.8}
              />
            </mesh>
            <mesh position={[0, -1.02, 0]}>
              <cylinderGeometry args={[0.73, 0.81, 0.50, 18, 6]} />
              <meshStandardMaterial
                color={isHit ? '#ffeedd' : '#0a1017'}
                emissive={glowColor}
                emissiveIntensity={isHit ? 1.4 : 0.12}
                transparent={true}
                opacity={0.4}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ---------------- THUMB ---------------- */}
      <group position={[-0.78 * sideX, -0.28, 0.12]} rotation={[0.35, -0.5 * sideX, 0.75 * sideX]}>
        <group ref={thumbMCP}>
          <FingerSegment
            length={0.52}
            radiusBase={0.16}
            radiusTip={0.14}
            isHit={isHit}
            glowColor={glowColor}
            handStyle={handStyle}
          >
            <group ref={thumbPIP}>
              <FingerSegment
                length={0.42}
                radiusBase={0.14}
                radiusTip={0.10}
                isHit={isHit}
                glowColor={glowColor}
                isTip={true}
                handStyle={handStyle}
              />
            </group>
          </FingerSegment>
        </group>
      </group>

      {/* ---------------- INDEX FINGER (F1) - Natural -8° Spread ---------------- */}
      <group position={[-0.48 * sideX, 0.82, 0]} rotation={[0, 0, 0.08 * sideX]}>
        <group ref={indexMCP}>
          <FingerSegment
            length={0.60}
            radiusBase={0.135}
            radiusTip={0.115}
            isHit={isHit}
            glowColor={glowColor}
            handStyle={handStyle}
          >
            <group ref={indexPIP}>
              <FingerSegment
                length={0.46}
                radiusBase={0.115}
                radiusTip={0.10}
                isHit={isHit}
                glowColor={glowColor}
                handStyle={handStyle}
              >
                <group ref={indexDIP}>
                  <FingerSegment
                    length={0.36}
                    radiusBase={0.10}
                    radiusTip={0.085}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                    handStyle={handStyle}
                  />
                </group>
              </FingerSegment>
            </group>
          </FingerSegment>
        </group>
      </group>

      {/* ---------------- MIDDLE FINGER (F2) - Longest Central Reference ---------------- */}
      <group position={[-0.16 * sideX, 0.92, 0]} rotation={[0, 0, 0]}>
        <group ref={middleMCP}>
          <FingerSegment
            length={0.68}
            radiusBase={0.14}
            radiusTip={0.12}
            isHit={isHit}
            glowColor={glowColor}
            handStyle={handStyle}
          >
            <group ref={middlePIP}>
              <FingerSegment
                length={0.50}
                radiusBase={0.12}
                radiusTip={0.105}
                isHit={isHit}
                glowColor={glowColor}
                handStyle={handStyle}
              >
                <group ref={middleDIP}>
                  <FingerSegment
                    length={0.38}
                    radiusBase={0.105}
                    radiusTip={0.09}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                    handStyle={handStyle}
                  />
                </group>
              </FingerSegment>
            </group>
          </FingerSegment>
        </group>
      </group>

      {/* ---------------- RING FINGER (F3) - Natural +7° Spread ---------------- */}
      <group position={[0.17 * sideX, 0.86, 0]} rotation={[0, 0, -0.07 * sideX]}>
        <group ref={ringMCP}>
          <FingerSegment
            length={0.63}
            radiusBase={0.135}
            radiusTip={0.115}
            isHit={isHit}
            glowColor={glowColor}
            handStyle={handStyle}
          >
            <group ref={ringPIP}>
              <FingerSegment
                length={0.46}
                radiusBase={0.115}
                radiusTip={0.098}
                isHit={isHit}
                glowColor={glowColor}
                handStyle={handStyle}
              >
                <group ref={ringDIP}>
                  <FingerSegment
                    length={0.36}
                    radiusBase={0.098}
                    radiusTip={0.085}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                    handStyle={handStyle}
                  />
                </group>
              </FingerSegment>
            </group>
          </FingerSegment>
        </group>
      </group>

      {/* ---------------- PINKY FINGER (F4) - Natural +16° Spread & Slim Taper ---------------- */}
      <group position={[0.48 * sideX, 0.75, 0]} rotation={[0, 0, -0.16 * sideX]}>
        <group ref={pinkyMCP}>
          <FingerSegment
            length={0.50}
            radiusBase={0.12}
            radiusTip={0.10}
            isHit={isHit}
            glowColor={glowColor}
            handStyle={handStyle}
          >
            <group ref={pinkyPIP}>
              <FingerSegment
                length={0.38}
                radiusBase={0.10}
                radiusTip={0.085}
                isHit={isHit}
                glowColor={glowColor}
                handStyle={handStyle}
              >
                <group ref={pinkyDIP}>
                  <FingerSegment
                    length={0.30}
                    radiusBase={0.085}
                    radiusTip={0.072}
                    isHit={isHit}
                    glowColor={glowColor}
                    isTip={true}
                    handStyle={handStyle}
                  />
                </group>
              </FingerSegment>
            </group>
          </FingerSegment>
        </group>
      </group>
    </group>
  );
};

// Main Exported Canvas Wrapper Component
export interface Hand3DProps {
  side?: 'rh' | 'lh';
  viewMode?: 'rh' | 'lh' | 'both';
  handStyle?: HandStyleType;
}

export const Hand3D: React.FC<Hand3DProps> = ({ side, viewMode, handStyle: propStyle }) => {
  const storeViewMode = useGloveStore((s) => s.viewMode);
  const storeHandStyle = useGloveStore((s) => s.handStyle);
  const activeViewMode = viewMode || storeViewMode || side || 'both';
  const activeHandStyle: HandStyleType = propStyle || storeHandStyle || 'particles';

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
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 5]} intensity={1.2} color="#eef6ff" />
        <directionalLight position={[-6, -4, -4]} intensity={0.6} color="#35c3ff" />
        <pointLight position={[0, 0, 5]} intensity={1.2} color="#00f0ff" distance={12} />
        <pointLight position={[-4, 4, 3]} intensity={0.9} color="#00ffaa" distance={10} />

        {/* The Cyber Hand Model(s) */}
        {activeViewMode === 'both' ? (
          <>
            <HandModel side="lh" position={[-1.75, -0.6, 0]} handStyle={activeHandStyle} />
            <HandModel side="rh" position={[1.75, -0.6, 0]} handStyle={activeHandStyle} />
          </>
        ) : (
          <HandModel side={activeViewMode === 'lh' ? 'lh' : 'rh'} position={[0, -0.6, 0]} handStyle={activeHandStyle} />
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
