import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGloveStore, FLEX_SENSORS_DEF, FlexSensorId } from '../store/useGloveStore';
import {
  Music,
  RotateCw,
  Sliders,
  Terminal,
  Trash2,
  Volume2,
  Zap,
  Check,
  RefreshCw,
  HandMetal,
  Radio,
} from 'lucide-react';

export const DRUM_PADS = [
  { key: 'kick', label: 'KICK', note: 36, defaultColor: '#ff5500' },
  { key: 'snare', label: 'SNARE', note: 38, defaultColor: '#00f0ff' },
  { key: 'closed_hihat', label: 'HI-HAT', note: 42, defaultColor: '#00ff88' },
  { key: 'open_hihat', label: 'OPEN HH', note: 46, defaultColor: '#ff007f' },
  { key: 'low_tom', label: 'LOW TOM', note: 45, defaultColor: '#38bdf8' },
  { key: 'mid_tom', label: 'MID TOM', note: 47, defaultColor: '#818cf8' },
  { key: 'high_tom', label: 'HIGH TOM', note: 50, defaultColor: '#a78bfa' },
  { key: 'crash', label: 'CRASH', note: 49, defaultColor: '#f43f5e' },
  { key: 'ride', label: 'RIDE', note: 51, defaultColor: '#fb923c' },
  { key: 'ride_bell', label: 'RIDE BELL', note: 53, defaultColor: '#facc15' },
  { key: 'china', label: 'CHINA', note: 52, defaultColor: '#c084fc' },
  { key: 'splash', label: 'SPLASH', note: 55, defaultColor: '#2dd4bf' },
  { key: 'cowbell', label: 'COWBELL', note: 56, defaultColor: '#f59e0b' },
  { key: 'clap', label: 'CLAP', note: 39, defaultColor: '#ec4899' },
];

export const RightColumn: React.FC = () => {
  const {
    ports,
    midi,
    settings,
    activePads,
    logs,
    triggerTestNote,
    openMidi,
    listPorts,
    updateSetting,
    clearLogs,
    flexMappings,
    setFlexMapping,
    selectedFlexForMapping,
    setSelectedFlexForMapping,
    resetFlexMappings,
    rh,
    lh,
  } = useGloveStore();

  const [selectedMidi, setSelectedMidi] = useState<string>('');
  const [activeHandTab, setActiveHandTab] = useState<'rh' | 'lh'>('rh');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleOpenMidi = () => {
    const portToOpen = selectedMidi || (ports.midi.length > 0 ? ports.midi[0] : '');
    if (portToOpen) {
      openMidi(portToOpen);
    }
  };

  // Helper to check if a specific flex sensor is actively bent right now
  const isSensorBent = (sensorId: FlexSensorId): boolean => {
    if (sensorId === 'rh_f1') return rh.f1 > settings.flex1_threshold || (rh.bend?.f1 ?? 0) > 15;
    if (sensorId === 'rh_f2') return rh.f2 > settings.flex2_threshold || (rh.bend?.f2 ?? 0) > 15;
    if (sensorId === 'rh_f3') return rh.f3 > settings.flex3_threshold || (rh.bend?.f3 ?? 0) > 15;
    if (sensorId === 'rh_f4') return rh.f4 > settings.flex4_threshold || (rh.bend?.f4 ?? 0) > 15;
    if (sensorId === 'lh_f1') return lh.f1 > settings.flex1_threshold || (lh.bend?.f1 ?? 0) > 15;
    if (sensorId === 'lh_f2') return lh.f2 > settings.flex2_threshold || (lh.bend?.f2 ?? 0) > 15;
    if (sensorId === 'lh_f3') return lh.f3 > settings.flex3_threshold || (lh.bend?.f3 ?? 0) > 15;
    if (sensorId === 'lh_f4') return lh.f4 > settings.flex4_threshold || (lh.bend?.f4 ?? 0) > 15;
    return false;
  };

  // Get all flex sensors assigned to a given drum note
  const getAssignedSensorsForNote = (note: number) => {
    return FLEX_SENSORS_DEF.filter((sensor) => flexMappings[sensor.id] === note);
  };

  // Check if any flex sensor mapped to this pad is actively bending
  const isPadLiveActive = (note: number): boolean => {
    const assigned = getAssignedSensorsForNote(note);
    return assigned.some((sensor) => isSensorBent(sensor.id));
  };

  // Handle pad click (either tests note or completes mapping assignment)
  const handlePadClick = (note: number) => {
    if (selectedFlexForMapping) {
      setFlexMapping(selectedFlexForMapping, note);
      triggerTestNote(note, 110);
    } else {
      triggerTestNote(note);
    }
  };

  const selectedSensorConfig = useMemo(() => {
    return selectedFlexForMapping
      ? FLEX_SENSORS_DEF.find((s) => s.id === selectedFlexForMapping)
      : null;
  }, [selectedFlexForMapping]);

  const currentHandSensors = FLEX_SENSORS_DEF.filter((s) => s.side === activeHandTab);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pl-1">
      {/* ---------------- 14-BUTTON DRUM PAD GRID & FLEX MAPPING ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyber-cyan" />
            <h2 className="text-xs font-bold font-mono text-cyber-cyan uppercase tracking-wider">
              DRUM PADS & FLEX MAPPING
            </h2>
          </div>
          <button
            onClick={resetFlexMappings}
            title="Reset All Flex Mappings to Defaults"
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#15171c] hover:bg-[#252834] border border-cyber-border text-[10px] font-mono text-cyber-textMuted hover:text-cyber-cyan transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Reset Defaults
          </button>
        </div>

        {/* ---------------- FLEX SENSOR ASSIGNMENT CONTROLLER ---------------- */}
        <div className="bg-[#121418] border border-cyber-border/80 rounded-xl p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyber-textMuted flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyber-amber" /> SELECT SENSOR TO MAP:
            </span>

            {/* Hand Switcher (RH / LH) */}
            <div className="flex bg-[#0f1114] p-0.5 rounded-lg border border-cyber-border">
              <button
                onClick={() => setActiveHandTab('rh')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  activeHandTab === 'rh'
                    ? 'bg-cyber-cyan text-black'
                    : 'text-cyber-textMuted hover:text-white'
                }`}
              >
                RIGHT HAND (RH)
              </button>
              <button
                onClick={() => setActiveHandTab('lh')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  activeHandTab === 'lh'
                    ? 'bg-cyber-green text-black'
                    : 'text-cyber-textMuted hover:text-white'
                }`}
              >
                LEFT HAND (LH)
              </button>
            </div>
          </div>

          {/* 4 Flex Sensor Selector Cards for Active Hand */}
          <div className="grid grid-cols-2 gap-1.5">
            {currentHandSensors.map((sensor) => {
              const isSelected = selectedFlexForMapping === sensor.id;
              const isBent = isSensorBent(sensor.id);
              const mappedNote = flexMappings[sensor.id];
              const mappedPad = DRUM_PADS.find((p) => p.note === mappedNote);

              return (
                <button
                  key={sensor.id}
                  onClick={() =>
                    setSelectedFlexForMapping(isSelected ? null : sensor.id)
                  }
                  className={`p-2 rounded-xl border font-mono text-left flex flex-col gap-0.5 transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-cyber-cyan/20 border-cyber-cyan shadow-glowCyan scale-[1.01]'
                      : isBent
                      ? 'bg-cyber-amber/15 border-cyber-amber shadow-glowAmber'
                      : 'bg-[#171a22] hover:bg-[#202430] border-cyber-border/70 text-cyber-textBright'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-extrabold flex items-center gap-1"
                      style={{ color: sensor.color }}
                    >
                      <Zap className="w-3 h-3" />
                      {sensor.label}
                    </span>
                    {isBent && (
                      <span className="w-2 h-2 rounded-full bg-cyber-amber animate-ping" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyber-textMuted">{sensor.finger}</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-cyber-cyan text-black font-extrabold'
                          : 'bg-[#0f1114] text-cyber-textBright border border-cyber-border/50'
                      }`}
                    >
                      {mappedPad ? mappedPad.label : `NOTE #${mappedNote}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Assignment Guide Alert Banner */}
          {selectedSensorConfig && (
            <div className="bg-cyber-cyan/15 border border-cyber-cyan p-2 rounded-lg text-xs font-mono flex items-center justify-between animate-pulse">
              <span className="text-cyber-cyan font-bold flex items-center gap-1.5">
                <HandMetal className="w-3.5 h-3.5" />
                CLICK ANY DRUM PAD TO BIND [{selectedSensorConfig.label}: {selectedSensorConfig.finger}]
              </span>
              <button
                onClick={() => setSelectedFlexForMapping(null)}
                className="text-[10px] text-cyber-textMuted hover:text-white underline ml-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ---------------- 14-PAD DRUM GRID ---------------- */}
        <div className="grid grid-cols-3 gap-2">
          {DRUM_PADS.map((pad) => {
            const isFired = !!activePads[pad.note];
            const assignedSensors = getAssignedSensorsForNote(pad.note);
            const isAssigned = assignedSensors.length > 0;
            const isLiveBent = isPadLiveActive(pad.note);
            const isTargetedForAssign = !!selectedFlexForMapping;

            return (
              <div
                key={pad.key}
                onClick={() => handlePadClick(pad.note)}
                className={`relative rounded-xl p-2 flex flex-col justify-between min-h-[78px] font-mono transition-all duration-75 select-none cursor-pointer border ${
                  isFired
                    ? 'bg-cyber-amber text-black scale-[0.97] shadow-glowAmber border-white font-extrabold z-10'
                    : isLiveBent
                    ? 'bg-cyber-cyan/25 border-cyber-cyan shadow-glowCyan scale-[1.01]'
                    : isAssigned
                    ? 'bg-[#161a24] hover:bg-[#202634] border-cyber-cyan/40 hover:border-cyber-cyan'
                    : 'bg-[#14161c] hover:bg-[#1f222b] border-cyber-border hover:border-cyber-borderLight'
                } ${isTargetedForAssign ? 'border-dashed border-cyber-cyan/80 hover:bg-cyber-cyan/10' : ''}`}
              >
                {/* Top Row: Pad Label & Note # */}
                <div className="flex items-start justify-between">
                  <span
                    className={`text-xs font-extrabold tracking-wide ${
                      isFired
                        ? 'text-black'
                        : isAssigned
                        ? 'text-white'
                        : 'text-cyber-textBright'
                    }`}
                  >
                    {pad.label}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${
                      isFired ? 'text-black/80' : 'text-cyber-textMuted'
                    }`}
                  >
                    #{pad.note}
                  </span>
                </div>

                {/* Middle: Active Flex Sensor Badges */}
                <div className="flex flex-wrap gap-1 my-1">
                  {assignedSensors.map((sensor) => (
                    <span
                      key={sensor.id}
                      className="px-1 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5 border"
                      style={{
                        backgroundColor: `${sensor.color}22`,
                        borderColor: `${sensor.color}88`,
                        color: sensor.color,
                      }}
                      title={`${sensor.label} (${sensor.finger}) mapped to ${pad.label}`}
                    >
                      <Zap className="w-2.5 h-2.5" />
                      {sensor.label}
                    </span>
                  ))}
                  {!isAssigned && !isTargetedForAssign && (
                    <span className="text-[9px] text-cyber-textMuted/40 italic">
                      unassigned
                    </span>
                  )}
                  {isTargetedForAssign && (
                    <span className="text-[9px] text-cyber-cyan font-bold animate-pulse">
                      + Bind {selectedSensorConfig?.label}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Direct Flex Mapping Quick Selector */}
                <div
                  className="mt-1 pt-1 border-t border-cyber-border/40"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setFlexMapping(e.target.value as FlexSensorId, pad.note);
                      }
                    }}
                    className="w-full bg-[#0d0f12] text-[9px] text-cyber-textMuted font-mono px-1 py-0.5 rounded border border-cyber-border/60 focus:border-cyber-cyan focus:outline-none cursor-pointer hover:text-white"
                  >
                    <option value="">⚙️ Map Flex...</option>
                    <optgroup label="Right Hand (RH)">
                      <option value="rh_f1">RH F1 (Index)</option>
                      <option value="rh_f2">RH F2 (Middle)</option>
                      <option value="rh_f3">RH F3 (Ring)</option>
                      <option value="rh_f4">RH F4 (Pinky)</option>
                    </optgroup>
                    <optgroup label="Left Hand (LH)">
                      <option value="lh_f1">LH F1 (Index)</option>
                      <option value="lh_f2">LH F2 (Middle)</option>
                      <option value="lh_f3">LH F3 (Ring)</option>
                      <option value="lh_f4">LH F4 (Pinky)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- MIDI OUTPUT ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-cyber-cyan flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" /> MIDI ENGINE OUTPUT
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              midi.connected ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-red/20 text-cyber-red'
            }`}
          >
            {midi.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={selectedMidi || (ports.midi[0] ?? '')}
            onChange={(e) => setSelectedMidi(e.target.value)}
            className="flex-1 bg-[#15171c] text-xs font-mono text-cyber-textBright px-3 py-2 rounded-xl border border-cyber-border focus:border-cyber-cyan focus:outline-none"
          >
            {ports.midi.length === 0 ? (
              <option value="">No MIDI ports detected</option>
            ) : (
              ports.midi.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => listPorts()}
            title="Refresh MIDI Ports"
            className="p-2 rounded-xl bg-[#15171c] hover:bg-[#252834] border border-cyber-border text-cyber-textMuted hover:text-cyber-cyan transition-all"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenMidi}
            className="px-3 py-2 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-black text-xs font-bold font-mono transition-all"
          >
            Open
          </button>
        </div>
      </div>

      {/* ---------------- SETTINGS SLIDERS ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-cyber-cyan flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> ENGINE SETTINGS
          </span>
          <span className="text-[10px] font-mono text-cyber-textMuted">Live sync</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Flex 1..4 Thresholds */}
          {(['flex1_threshold', 'flex2_threshold', 'flex3_threshold', 'flex4_threshold'] as const).map(
            (key, idx) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyber-textMuted">Flex {idx + 1} Threshold:</span>
                  <span className="text-cyber-cyan font-bold tabular-nums">{settings[key]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={settings[key]}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                  className="w-full accent-cyber-cyan cursor-pointer bg-[#121418] h-1.5 rounded-lg"
                />
              </div>
            )
          )}

          {/* Movement Threshold */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyber-textMuted">Movement Threshold:</span>
              <span className="text-cyber-green font-bold tabular-nums">
                {settings.movement_threshold.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="0.5"
              value={settings.movement_threshold}
              onChange={(e) => updateSetting('movement_threshold', Number(e.target.value))}
              className="w-full accent-cyber-green cursor-pointer bg-[#121418] h-1.5 rounded-lg"
            />
          </div>

          {/* Smoothing */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyber-textMuted">Smoothing (Alpha):</span>
              <span className="text-cyber-cyan font-bold tabular-nums">
                {settings.smoothing.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={settings.smoothing}
              onChange={(e) => updateSetting('smoothing', Number(e.target.value))}
              className="w-full accent-cyber-cyan cursor-pointer bg-[#121418] h-1.5 rounded-lg"
            />
          </div>

          {/* Velocity Sensitivity */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyber-textMuted">Velocity Sensitivity:</span>
              <span className="text-cyber-amber font-bold tabular-nums">
                {settings.velocity_sensitivity.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={settings.velocity_sensitivity}
              onChange={(e) => updateSetting('velocity_sensitivity', Number(e.target.value))}
              className="w-full accent-cyber-amber cursor-pointer bg-[#121418] h-1.5 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ---------------- ACTIVITY LOG (LAST 200 LINES) ---------------- */}
      <div className="bg-cyber-panel border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-cyber-textBright flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyber-cyan" /> ACTIVITY LOG
          </span>
          <button
            onClick={clearLogs}
            title="Clear Log"
            className="flex items-center gap-1 text-[11px] font-mono text-cyber-textMuted hover:text-cyber-red transition-all"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="h-36 overflow-y-auto bg-[#0f1114] border border-cyber-border/80 rounded-xl p-2.5 font-mono text-[11px] flex flex-col-reverse gap-1 text-cyber-textMuted selection:bg-cyber-cyan/30"
        >
          {logs.length === 0 ? (
            <div className="text-cyber-textMuted/50 italic py-2 text-center">
              No activity logged yet...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="leading-snug break-all text-cyber-textBright/90">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RightColumn;
