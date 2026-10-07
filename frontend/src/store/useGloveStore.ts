import { create } from 'zustand';
import { GloveState, GloveSettings, DrumHit, PortInfo, MidiState, InboundMessage } from '../types';

const defaultGloveState = (): GloveState => ({
  connected: false,
  f1: 0,
  f2: 0,
  f3: 0,
  f4: 0,
  ax: 0,
  ay: 0,
  az: 0,
  gx: 0,
  gy: 0,
  gz: 0,
  movement: 0,
  bend: { f1: 0, f2: 0, f3: 0, f4: 0 },
  calibPct: 0,
  isCalibrating: false,
  calibDone: false,
  lastUpdated: 0,
});

export type HandStyleType = 'particles' | 'anatomical' | 'hybrid' | 'wireframe' | 'triangulated' | 'solid';

interface GloveStore {
  wsConnected: boolean;
  activeSide: 'rh' | 'lh';
  viewMode: 'rh' | 'lh' | 'both';
  handStyle: HandStyleType;
  rh: GloveState;
  lh: GloveState;
  settings: GloveSettings;
  ports: PortInfo;
  midi: MidiState;
  lastHit: DrumHit | null;
  activePads: Record<number, boolean>;
  isHandFlashing: boolean;
  logs: string[];

  // Actions
  connectWebSocket: () => void;
  send: (msg: any) => void;
  setActiveSide: (side: 'rh' | 'lh') => void;
  setViewMode: (mode: 'rh' | 'lh' | 'both') => void;
  setHandStyle: (style: 'triangulated' | 'hybrid' | 'particles' | 'wireframe' | 'solid' | 'anatomical') => void;
  updateSetting: (key: keyof GloveSettings, value: number) => void;
  triggerTestNote: (note: number) => void;
  connectGlove: (side: 'rh' | 'lh', mode: string, port: string | number) => void;
  disconnectGlove: (side: 'rh' | 'lh') => void;
  calibrate: (side: 'rh' | 'lh') => void;
  suggestThresholds: (side: 'rh' | 'lh') => void;
  openMidi: (name: string) => void;
  listPorts: () => void;
  clearLogs: () => void;
}

let socket: WebSocket | null = null;
let reconnectTimer: any = null;
let handFlashTimer: any = null;
const padFlashTimers: Record<number, any> = {};

export const useGloveStore = create<GloveStore>((set, get) => ({
  wsConnected: false,
  activeSide: 'rh',
  viewMode: 'both',
  handStyle: 'wireframe',
  rh: defaultGloveState(),
  lh: defaultGloveState(),
  settings: {
    flex1_threshold: 20,
    flex2_threshold: 20,
    flex3_threshold: 20,
    flex4_threshold: 20,
    movement_threshold: 5.0,
    gesture_cooldown: 0.20,
    smoothing: 0.35,
    velocity_sensitivity: 2.0,
    min_velocity: 40,
    max_velocity: 127,
  },
  ports: {
    serial: [],
    midi: [],
  },
  midi: {
    connected: false,
    name: '',
  },
  lastHit: null,
  activePads: {},
  isHandFlashing: false,
  logs: [],

  connectWebSocket: () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use backend port 8765 if Vite is running on another port, or window.location.host if served from FastAPI
    const wsHost = window.location.port === '5173' || window.location.port === '3000'
      ? `${window.location.hostname}:8765`
      : window.location.host;
    const wsUrl = `${protocol}//${wsHost}/ws`;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ wsConnected: true });
        const timeStr = new Date().toLocaleTimeString();
        set((state) => ({
          logs: [`[${timeStr}] WebSocket connected to ${wsUrl}`, ...state.logs.slice(0, 199)]
        }));
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data: InboundMessage = JSON.parse(event.data);
          const timeStr = new Date().toLocaleTimeString();

          switch (data.type) {
            case 'sensor_data': {
              const p = data.payload;
              const side = p.side === 'lh' ? 'lh' : 'rh';
              set((state) => ({
                [side]: {
                  ...state[side],
                  f1: p.f1 ?? 0,
                  f2: p.f2 ?? 0,
                  f3: p.f3 ?? 0,
                  f4: p.f4 ?? 0,
                  ax: p.ax ?? 0,
                  ay: p.ay ?? 0,
                  az: p.az ?? 0,
                  gx: p.gx ?? 0,
                  gy: p.gy ?? 0,
                  gz: p.gz ?? 0,
                  movement: p.movement ?? 0,
                  bend: p.bend ?? { f1: 0, f2: 0, f3: 0, f4: 0 },
                  lastUpdated: Date.now(),
                }
              }));
              break;
            }

            case 'drum_hit': {
              const p = data.payload;
              const hit: DrumHit = {
                side: p.side ?? 'rh',
                name: p.name ?? 'drum',
                note: p.note ?? 36,
                velocity: p.velocity ?? 100,
                timestamp: Date.now(),
              };

              // Flash 3D hand emissive amber for 150ms
              if (handFlashTimer) clearTimeout(handFlashTimer);
              set({ isHandFlashing: true, lastHit: hit });
              handFlashTimer = setTimeout(() => {
                set({ isHandFlashing: false });
              }, 150);

              // Flash corresponding drum pad for 150ms
              if (hit.note) {
                if (padFlashTimers[hit.note]) clearTimeout(padFlashTimers[hit.note]);
                set((state) => ({
                  activePads: { ...state.activePads, [hit.note]: true }
                }));
                padFlashTimers[hit.note] = setTimeout(() => {
                  set((state) => ({
                    activePads: { ...state.activePads, [hit.note]: false }
                  }));
                }, 150);
              }
              break;
            }

            case 'connection_changed': {
              const p = data.payload;
              const side = p.side === 'lh' ? 'lh' : 'rh';
              set((state) => ({
                [side]: {
                  ...state[side],
                  connected: !!p.connected
                }
              }));
              break;
            }

            case 'calibration_progress': {
              const p = data.payload;
              const side = p.side === 'lh' ? 'lh' : 'rh';
              set((state) => ({
                [side]: {
                  ...state[side],
                  calibPct: p.pct ?? 0,
                  isCalibrating: true
                }
              }));
              break;
            }

            case 'calibration_done': {
              const p = data.payload;
              const side = p.side === 'lh' ? 'lh' : 'rh';
              set((state) => ({
                [side]: {
                  ...state[side],
                  calibPct: 100,
                  isCalibrating: false,
                  calibDone: true
                }
              }));
              break;
            }

            case 'ports': {
              const p = data.payload;
              set({
                ports: {
                  serial: p.serial ?? [],
                  midi: p.midi ?? [],
                }
              });
              break;
            }

            case 'settings_update': {
              const p = data.payload;
              set((state) => ({
                settings: { ...state.settings, ...p }
              }));
              break;
            }

            case 'midi_status': {
              const p = data.payload;
              set({
                midi: {
                  connected: !!p.connected,
                  name: p.name ?? ''
                }
              });
              break;
            }

            case 'log': {
              const text = data.payload?.text ?? JSON.stringify(data.payload);
              set((state) => ({
                logs: [`[${timeStr}] ${text}`, ...state.logs.slice(0, 199)]
              }));
              break;
            }
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      socket.onclose = () => {
        set({ wsConnected: false });
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            get().connectWebSocket();
          }, 2000);
        }
      };

      socket.onerror = () => {
        set({ wsConnected: false });
      };
    } catch (e) {
      console.error('[WS] Connection failed:', e);
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          get().connectWebSocket();
        }, 3000);
      }
    }
  },

  send: (msg: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  },

  setActiveSide: (side: 'rh' | 'lh') => set({ activeSide: side }),
  setViewMode: (mode: 'rh' | 'lh' | 'both') => set({ viewMode: mode }),
  setHandStyle: (style: HandStyleType) => set({ handStyle: style }),

  updateSetting: (key: keyof GloveSettings, value: number) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value }
    }));
    get().send({
      type: 'update_setting',
      payload: { key, value }
    });
  },

  triggerTestNote: (note: number) => {
    get().send({
      type: 'trigger_test_note',
      payload: { note }
    });
  },

  connectGlove: (side: 'rh' | 'lh', mode: string, port: string | number) => {
    get().send({
      type: 'connect_glove',
      payload: { side, mode, port }
    });
  },

  disconnectGlove: (side: 'rh' | 'lh') => {
    get().send({
      type: 'disconnect_glove',
      payload: { side }
    });
  },

  calibrate: (side: 'rh' | 'lh') => {
    set((state) => ({
      [side]: { ...state[side], isCalibrating: true, calibPct: 0 }
    }));
    get().send({
      type: 'calibrate',
      payload: { side }
    });
  },

  suggestThresholds: (side: 'rh' | 'lh') => {
    get().send({
      type: 'suggest_thresholds',
      payload: { side }
    });
  },

  openMidi: (name: string) => {
    get().send({
      type: 'open_midi',
      payload: { name }
    });
  },

  listPorts: () => {
    get().send({ type: 'list_ports' });
    get().send({ type: 'list_midi_ports' });
  },

  clearLogs: () => set({ logs: [] }),
}));
