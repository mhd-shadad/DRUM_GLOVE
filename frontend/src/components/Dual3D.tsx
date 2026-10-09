import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useGloveStore, HandStyleType, DrumMeshStyleType, DrumCameraViewType } from '../store/useGloveStore';
import { HandModel } from './Hand3D';
import { DrumKitScene } from './Drum3D';

export const Dual3D: React.FC<{
  handStyle?: HandStyleType;
  drumMeshStyle?: DrumMeshStyleType;
  cameraView?: DrumCameraViewType;
}> = ({ handStyle: propHandStyle, drumMeshStyle: propDrumStyle }) => {
  const storeHandStyle = useGloveStore((s) => s.handStyle);
  const storeDrumStyle = useGloveStore((s) => s.drumMeshStyle);
  const viewMode = useGloveStore((s) => s.viewMode);

  const activeHandStyle: HandStyleType = propHandStyle || storeHandStyle || 'wireframe';
  const activeDrumStyle: DrumMeshStyleType = propDrumStyle || storeDrumStyle || 'chroma';

  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-[#07090d] overflow-hidden rounded-2xl border border-cyber-border/80 shadow-2xl">
      <Canvas
        camera={{ position: [0, 2.2, 4.4], fov: 48 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Dynamic Studio Lighting */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 9, 6]} intensity={1.3} color="#eef6ff" />
        <directionalLight position={[-6, -4, -4]} intensity={0.6} color="#35c3ff" />
        <pointLight position={[0, 3.5, 0.5]} intensity={1.4} color="#00f0ff" distance={10} />
        <pointLight position={[-3, 2, 2]} intensity={1.1} color="#ffb46b" distance={8} />
        <pointLight position={[3, 2, 2]} intensity={1.1} color="#7af0c4" distance={8} />

        {/* 3D Drum Kit */}
        <group position={[0, -0.4, -0.2]} scale={[0.88, 0.88, 0.88]}>
          <DrumKitScene drumMeshStyle={activeDrumStyle} />
        </group>

        {/* Holographic Cyber Hands Hovering Above Kit in Drummer Stance */}
        {viewMode === 'both' ? (
          <>
            <group position={[-0.95, 0.85, 1.3]} scale={[0.62, 0.62, 0.62]} rotation={[-0.45, 0.25, 0.15]}>
              <HandModel side="lh" position={[0, 0, 0]} handStyle={activeHandStyle} />
            </group>
            <group position={[0.95, 0.85, 1.3]} scale={[0.62, 0.62, 0.62]} rotation={[-0.45, -0.25, -0.15]}>
              <HandModel side="rh" position={[0, 0, 0]} handStyle={activeHandStyle} />
            </group>
          </>
        ) : (
          <group
            position={[viewMode === 'lh' ? -0.5 : 0.5, 0.85, 1.3]}
            scale={[0.65, 0.65, 0.65]}
            rotation={[-0.45, viewMode === 'lh' ? 0.2 : -0.2, 0]}
          >
            <HandModel side={viewMode === 'lh' ? 'lh' : 'rh'} position={[0, 0, 0]} handStyle={activeHandStyle} />
          </group>
        )}

        {/* Cyberpunk Grid Floor */}
        <Grid
          position={[0, -1.2, 0]}
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

      {/* Orbit Controls & Click Instruction Badge */}
      <div className="absolute bottom-3 left-4 text-[11px] font-mono text-cyber-textMuted/80 bg-[#07090d]/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyber-border/60 pointer-events-none flex items-center gap-2">
        <span className="text-cyber-green font-bold">DUAL MODE:</span> Air Drumming Hands + Meshware 3D Kit
      </div>
    </div>
  );
};

export default Dual3D;
