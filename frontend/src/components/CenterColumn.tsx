import React from 'react';
import { useGloveStore } from '../store/useGloveStore';
import Hand3D from './Hand3D';
import Drum3D from './Drum3D';
import Dual3D from './Dual3D';
import {
  Radio,
  Eye,
  Sparkles,
  Disc,
  Layers,
  Volume2,
  VolumeX,
  Camera,
  Activity,
} from 'lucide-react';

export const CenterColumn: React.FC = () => {
  const {
    activeSide,
    setActiveSide,
    viewMode,
    setViewMode,
    handStyle,
    setHandStyle,
    visualizerMode,
    setVisualizerMode,
    drumMeshStyle,
    setDrumMeshStyle,
    drumCameraView,
    setDrumCameraView,
    soundEnabled,
    setSoundEnabled,
    isHandFlashing,
    lastHit,
    rh,
    lh,
    settings,
  } = useGloveStore();

  // Active finger flex highlights for the HUD
  const f1Active = rh.f1 > settings.flex1_threshold || lh.f1 > settings.flex1_threshold || (rh.bend?.f1 > 15);
  const f2Active = rh.f2 > settings.flex2_threshold || lh.f2 > settings.flex2_threshold || (rh.bend?.f2 > 15);
  const f3Active = rh.f3 > settings.flex3_threshold || lh.f3 > settings.flex3_threshold || (rh.bend?.f3 > 15);
  const f4Active = rh.f4 > settings.flex4_threshold || lh.f4 > settings.flex4_threshold || (rh.bend?.f4 > 15);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ---------------- 3D VIEWPORT TOP BAR & MODE SWITCHER ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-3.5 shadow-lg flex flex-col gap-3">
        {/* Row 1: Mode Switcher & Title */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            {visualizerMode === 'drum' ? (
              <Disc className="w-4 h-4 text-cyber-amber animate-spin" />
            ) : visualizerMode === 'dual' ? (
              <Sparkles className="w-4 h-4 text-cyber-green animate-pulse" />
            ) : (
              <Eye className="w-4 h-4 text-cyber-cyan" />
            )}
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono">
              {visualizerMode === 'drum' && (
                <span className="text-cyber-amber">3D CYBER SPACE • 4-PIECE DRUM RIG</span>
              )}
              {visualizerMode === 'hand' && (
                <span className="text-cyber-cyan">3D CYBER SPACE • HOLOGRAPHIC HAND</span>
              )}
              {visualizerMode === 'dual' && (
                <span className="text-cyber-green">3D CYBER SPACE • AIR-DRUM STUDIO (DUAL)</span>
              )}
            </h2>
          </div>

          {/* Visualization Switcher (Drums vs Hand vs Dual) */}
          <div className="flex bg-[#121418] p-1 rounded-xl border border-cyber-border">
            <button
              onClick={() => setVisualizerMode('drum')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                visualizerMode === 'drum'
                  ? 'bg-gradient-to-r from-cyber-amber to-cyber-cyan text-black shadow-glowAmber font-extrabold'
                  : 'text-cyber-textMuted hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" /> 4-DRUM SET
            </button>
            <button
              onClick={() => setVisualizerMode('hand')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                visualizerMode === 'hand'
                  ? 'bg-cyber-cyan text-black shadow-glowCyan font-extrabold'
                  : 'text-cyber-textMuted hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 3D HANDS
            </button>
            <button
              onClick={() => setVisualizerMode('dual')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                visualizerMode === 'dual'
                  ? 'bg-gradient-to-r from-cyber-green to-cyber-cyan text-black shadow-glowGreen font-extrabold'
                  : 'text-cyber-textMuted hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> DUAL STUDIO
            </button>
          </div>
        </div>

        {/* Row 2: Contextual Controls based on active visualization */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1 border-t border-cyber-border/40">
          {/* DRUM MODE CONTROLS */}
          {visualizerMode === 'drum' && (
            <>
              {/* Meshware Color Theme Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted">MESHWARE:</span>
                <select
                  value={drumMeshStyle}
                  onChange={(e) => setDrumMeshStyle(e.target.value as any)}
                  className="bg-[#121418] text-xs font-mono text-cyber-cyan font-bold px-2.5 py-1 rounded-xl border border-cyber-border focus:border-cyber-cyan focus:outline-none cursor-pointer"
                >
                  <option value="particle_top">✨ TOP-DOWN PARTICLE MATRIX (Separated Vibrant Discs)</option>
                  <option value="particles">🌟 QUANTUM PARTICLES (3D Studio Kit + Particles)</option>
                  <option value="wireframe">🔥 CYBER WIREFRAME (Studio Neon Lattice)</option>
                  <option value="holographic">⚡ HOLOGRAPHIC GLOW (Cyber Shells)</option>
                  <option value="solid">🛡️ SOLID CYBER CHASSIS (Carbon & Metal)</option>
                  <option value="matrix">📐 MATRIX GREEN (Digital Scan Grid)</option>
                </select>
              </div>

              {/* Camera POV Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted flex items-center gap-1">
                  <Camera className="w-3 h-3 text-cyber-cyan" /> POV:
                </span>
                <div className="flex bg-[#121418] p-0.5 rounded-xl border border-cyber-border">
                  <button
                    onClick={() => setDrumCameraView('isometric')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                      drumCameraView === 'isometric'
                        ? 'bg-cyber-cyan text-black font-bold'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                    title="Angled 3D Isometric View"
                  >
                    3D ISO
                  </button>
                  <button
                    onClick={() => setDrumCameraView('drummer')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                      drumCameraView === 'drummer'
                        ? 'bg-cyber-amber text-black font-bold'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                    title="Drummer Throne View"
                  >
                    DRUMMER
                  </button>
                  <button
                    onClick={() => setDrumCameraView('audience')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                      drumCameraView === 'audience'
                        ? 'bg-cyber-green text-black font-bold'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                    title="Audience Stage View"
                  >
                    FRONT
                  </button>
                  <button
                    onClick={() => setDrumCameraView('top')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                      drumCameraView === 'top'
                        ? 'bg-cyber-purple text-black font-bold'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                    title="Top-Down Planar View"
                  >
                    TOP
                  </button>
                </div>
              </div>

              {/* Instant Web Audio Synth Sound Mute/Unmute */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                  soundEnabled
                    ? 'bg-cyber-green/15 border-cyber-green text-cyber-green hover:bg-cyber-green/25'
                    : 'bg-[#121418] border-cyber-border text-cyber-textMuted hover:text-white'
                }`}
                title="Toggle Web Audio Drum Synth on 3D Clicks & Hits"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyber-green" /> AUDIO ON
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-cyber-red" /> MUTED
                  </>
                )}
              </button>
            </>
          )}

          {/* HAND MODE CONTROLS */}
          {visualizerMode === 'hand' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted">HAND STYLE:</span>
                <select
                  value={handStyle}
                  onChange={(e) => setHandStyle(e.target.value as any)}
                  className="bg-[#121418] text-xs font-mono text-cyber-cyan font-bold px-3 py-1 rounded-xl border border-cyber-border focus:border-cyber-cyan focus:outline-none cursor-pointer"
                >
                  <option value="wireframe">🔥 CYBER WIREFRAME (Studio Hand)</option>
                  <option value="particles">✨ QUANTUM PARTICLES (GLOVETONE v1.0)</option>
                  <option value="hybrid">⚡ CYBER HYBRID (Particles + Mesh)</option>
                  <option value="anatomical">🧬 ANATOMICAL SCULPT (Human Form)</option>
                  <option value="solid">🛡️ SOLID CYBER CHASSIS</option>
                  <option value="triangulated">📐 LOW-POLY TRIANGULATED</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted">VIEW:</span>
                <div className="flex bg-[#121418] p-1 rounded-xl border border-cyber-border">
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                      viewMode === 'both'
                        ? 'bg-gradient-to-r from-cyber-cyan to-cyber-green text-black shadow-glowCyan'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                  >
                    BOTH
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('rh');
                      setActiveSide('rh');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                      viewMode === 'rh'
                        ? 'bg-cyber-cyan text-black shadow-glowCyan'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                  >
                    RH
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('lh');
                      setActiveSide('lh');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                      viewMode === 'lh'
                        ? 'bg-cyber-green text-black shadow-glowGreen'
                        : 'text-cyber-textMuted hover:text-white'
                    }`}
                  >
                    LH
                  </button>
                </div>
              </div>
            </>
          )}

          {/* DUAL MODE CONTROLS */}
          {visualizerMode === 'dual' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted">DRUM:</span>
                <select
                  value={drumMeshStyle}
                  onChange={(e) => setDrumMeshStyle(e.target.value as any)}
                  className="bg-[#121418] text-xs font-mono text-cyber-amber font-bold px-2 py-1 rounded-xl border border-cyber-border focus:border-cyber-amber focus:outline-none cursor-pointer"
                >
                  <option value="particle_top">✨ Top-Down Particles</option>
                  <option value="particles">🌟 Quantum Particles</option>
                  <option value="wireframe">🔥 Wireframe</option>
                  <option value="holographic">⚡ Holographic</option>
                  <option value="solid">🛡️ Solid</option>
                  <option value="matrix">📐 Matrix</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-cyber-textMuted">HAND:</span>
                <select
                  value={handStyle}
                  onChange={(e) => setHandStyle(e.target.value as any)}
                  className="bg-[#121418] text-xs font-mono text-cyber-cyan font-bold px-2 py-1 rounded-xl border border-cyber-border focus:border-cyber-cyan focus:outline-none cursor-pointer"
                >
                  <option value="wireframe">🔥 Wireframe</option>
                  <option value="particles">✨ Particles</option>
                  <option value="hybrid">⚡ Hybrid</option>
                  <option value="anatomical">🧬 Human</option>
                </select>
              </div>

              <div className="flex bg-[#121418] p-0.5 rounded-xl border border-cyber-border">
                <button
                  onClick={() => setViewMode('both')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    viewMode === 'both' ? 'bg-cyber-green text-black' : 'text-cyber-textMuted hover:text-white'
                  }`}
                >
                  BOTH
                </button>
                <button
                  onClick={() => {
                    setViewMode('rh');
                    setActiveSide('rh');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    viewMode === 'rh' ? 'bg-cyber-cyan text-black' : 'text-cyber-textMuted hover:text-white'
                  }`}
                >
                  RH
                </button>
                <button
                  onClick={() => {
                    setViewMode('lh');
                    setActiveSide('lh');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    viewMode === 'lh' ? 'bg-cyber-green text-black' : 'text-cyber-textMuted hover:text-white'
                  }`}
                >
                  LH
                </button>
              </div>
            </>
          )}
        </div>

        {/* Live Drum Hit Pulse Banner */}
        <div
          className={`w-full py-2 px-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
            isHandFlashing
              ? 'bg-cyber-amber/25 border-cyber-amber shadow-glowAmber scale-[1.01]'
              : 'bg-[#15171c] border-cyber-border'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles
              className={`w-4 h-4 transition-colors ${
                isHandFlashing ? 'text-cyber-amber animate-spin' : 'text-cyber-textMuted'
              }`}
            />
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-cyber-textMuted">LAST HIT:</span>
              <span
                className={`text-sm font-extrabold uppercase tracking-wide ${
                  isHandFlashing ? 'text-cyber-amber' : 'text-cyber-textBright'
                }`}
              >
                {lastHit ? lastHit.name : 'NO RECENT HIT'}
              </span>
            </div>
          </div>

          {lastHit && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cyber-cyan font-bold">NOTE #{lastHit.note}</span>
              <span className="text-cyber-green">VEL: {lastHit.velocity}</span>
              <span className="text-cyber-amber uppercase font-extrabold">[{lastHit.side}]</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- 3D CANVAS VIEWPORT ---------------- */}
      <div className="relative flex-1 min-h-[460px] w-full">
        {visualizerMode === 'drum' && (
          <Drum3D drumMeshStyle={drumMeshStyle} cameraView={drumCameraView} />
        )}
        {visualizerMode === 'hand' && (
          <Hand3D viewMode={viewMode} handStyle={handStyle} />
        )}
        {visualizerMode === 'dual' && (
          <Dual3D handStyle={handStyle} drumMeshStyle={drumMeshStyle} cameraView={drumCameraView} />
        )}

        {/* Floating Telemetry HUD Overlays */}
        {/* DRUM MODE TELEMETRY HUD */}
        {visualizerMode === 'drum' && (
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
            <div className="flex flex-col gap-1 bg-[#15171c]/90 backdrop-blur-md p-2.5 rounded-xl border border-cyber-amber/50 text-xs font-mono shadow-lg">
              <div className="flex items-center justify-between gap-3 border-b border-cyber-border/50 pb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyber-amber">
                  <Disc className="w-3.5 h-3.5 text-cyber-amber animate-spin" />
                  MESHWARE DRUM RIG
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyber-green/20 text-cyber-green flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> ONLINE
                </span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                STYLE: <span className="text-cyber-amber font-bold uppercase">{drumMeshStyle}</span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                STATUS: <span className="text-cyber-cyan font-bold">RECOIL & SONIC RIPPLES ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* HAND OR DUAL MODE TELEMETRY HUDs */}
        {(visualizerMode === 'hand' || visualizerMode === 'dual') && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
              {(viewMode === 'both' || viewMode === 'lh') && (
                <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-green/40 text-xs font-mono shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                    <span className="flex items-center gap-1.5 font-bold text-cyber-green">
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          lh.connected ? 'text-cyber-green animate-pulse' : 'text-cyber-red'
                        }`}
                      />
                      LEFT HAND (LH)
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        lh.connected ? 'text-cyber-green' : 'text-cyber-red'
                      }`}
                    >
                      {lh.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    FLEX:{' '}
                    <span className="text-cyber-green font-bold">
                      F1:{lh.f1} F2:{lh.f2} F3:{lh.f3} F4:{lh.f4}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    IMU:{' '}
                    <span className="text-cyber-green font-bold">
                      {lh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {lh.movement.toFixed(1)})
                    </span>
                  </div>
                </div>
              )}

              {viewMode === 'rh' && (
                <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-cyan/40 text-xs font-mono shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                    <span className="flex items-center gap-1.5 font-bold text-cyber-cyan">
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          rh.connected ? 'text-cyber-cyan animate-pulse' : 'text-cyber-red'
                        }`}
                      />
                      RIGHT HAND (RH)
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        rh.connected ? 'text-cyber-green' : 'text-cyber-red'
                      }`}
                    >
                      {rh.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    FLEX:{' '}
                    <span className="text-cyber-cyan font-bold">
                      F1:{rh.f1} F2:{rh.f2} F3:{rh.f3} F4:{rh.f4}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    IMU:{' '}
                    <span className="text-cyber-cyan font-bold">
                      {rh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {rh.movement.toFixed(1)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {viewMode === 'both' && (
              <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-none z-10">
                <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-cyan/40 text-xs font-mono shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                    <span className="flex items-center gap-1.5 font-bold text-cyber-cyan">
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          rh.connected ? 'text-cyber-cyan animate-pulse' : 'text-cyber-red'
                        }`}
                      />
                      RIGHT HAND (RH)
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        rh.connected ? 'text-cyber-green' : 'text-cyber-red'
                      }`}
                    >
                      {rh.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    FLEX:{' '}
                    <span className="text-cyber-cyan font-bold">
                      F1:{rh.f1} F2:{rh.f2} F3:{rh.f3} F4:{rh.f4}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyber-textMuted">
                    IMU:{' '}
                    <span className="text-cyber-cyan font-bold">
                      {rh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {rh.movement.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CenterColumn;
