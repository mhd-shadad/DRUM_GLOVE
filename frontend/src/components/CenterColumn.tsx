import React from 'react';
import { useGloveStore } from '../store/useGloveStore';
import Hand3D from './Hand3D';
import { Radio, Eye, Sparkles } from 'lucide-react';

export const CenterColumn: React.FC = () => {
  const {
    activeSide,
    setActiveSide,
    viewMode,
    setViewMode,
    handStyle,
    setHandStyle,
    isHandFlashing,
    lastHit,
    rh,
    lh,
  } = useGloveStore();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ---------------- 3D HAND TOP BAR & HIT PULSE ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyber-cyan" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyber-cyan font-mono">
              3D CYBER SPACE • HOLOGRAPHIC HAND
            </h2>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Holographic Style selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-cyber-textMuted">STYLE:</span>
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

            {/* Hand view toggle */}
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
                  RH (Right)
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
                  LH (Left)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Drum Hit Pulse Banner */}
        <div
          className={`w-full py-2.5 px-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
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
              <span className="text-cyber-cyan">NOTE: {lastHit.note}</span>
              <span className="text-cyber-green">VEL: {lastHit.velocity}</span>
              <span className="text-cyber-amber uppercase">[{lastHit.side}]</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- 3D CANVAS VIEWPORT ---------------- */}
      <div className="relative flex-1 min-h-[460px] w-full">
        <Hand3D viewMode={viewMode} handStyle={handStyle} />

        {/* Floating Dual Telemetry HUD Overlays */}
        {/* Left Side Overlay (LH in dual mode, or single hand) */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
          {(viewMode === 'both' || viewMode === 'lh') && (
            <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-green/40 text-xs font-mono shadow-lg">
              <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyber-green">
                  <Radio className={`w-3.5 h-3.5 ${lh.connected ? 'text-cyber-green animate-pulse' : 'text-cyber-red'}`} />
                  LEFT HAND (LH)
                </span>
                <span className={`text-[10px] font-bold ${lh.connected ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {lh.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                FLEX: <span className="text-cyber-green font-bold">F1:{lh.f1} F2:{lh.f2} F3:{lh.f3} F4:{lh.f4}</span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                IMU: <span className="text-cyber-green font-bold">{lh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {lh.movement.toFixed(1)})</span>
              </div>
            </div>
          )}

          {viewMode === 'rh' && (
            <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-cyan/40 text-xs font-mono shadow-lg">
              <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyber-cyan">
                  <Radio className={`w-3.5 h-3.5 ${rh.connected ? 'text-cyber-cyan animate-pulse' : 'text-cyber-red'}`} />
                  RIGHT HAND (RH)
                </span>
                <span className={`text-[10px] font-bold ${rh.connected ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {rh.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                FLEX: <span className="text-cyber-cyan font-bold">F1:{rh.f1} F2:{rh.f2} F3:{rh.f3} F4:{rh.f4}</span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                IMU: <span className="text-cyber-cyan font-bold">{rh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {rh.movement.toFixed(1)})</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Overlay (RH in dual mode) */}
        {viewMode === 'both' && (
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 pointer-events-none z-10">
            <div className="flex flex-col gap-1 bg-[#15171c]/85 backdrop-blur-md p-2.5 rounded-xl border border-cyber-cyan/40 text-xs font-mono shadow-lg">
              <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 pb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyber-cyan">
                  <Radio className={`w-3.5 h-3.5 ${rh.connected ? 'text-cyber-cyan animate-pulse' : 'text-cyber-red'}`} />
                  RIGHT HAND (RH)
                </span>
                <span className={`text-[10px] font-bold ${rh.connected ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {rh.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                FLEX: <span className="text-cyber-cyan font-bold">F1:{rh.f1} F2:{rh.f2} F3:{rh.f3} F4:{rh.f4}</span>
              </div>
              <div className="text-[11px] text-cyber-textMuted">
                IMU: <span className="text-cyber-cyan font-bold">{rh.movement > 5.0 ? 'DYNAMIC' : 'STEADY'} (Mv: {rh.movement.toFixed(1)})</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterColumn;
