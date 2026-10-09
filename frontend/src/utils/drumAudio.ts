// High-performance Web Audio API drum synthesizer for zero-latency interactive 3D drum hits
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Generate synthetic white noise buffer for snares and cymbals
let noiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
};

export const playDrumSound = (note: number, velocity: number = 100) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const gainRatio = Math.max(0.1, Math.min(1.0, velocity / 127));
    const now = ctx.currentTime;

    switch (note) {
      // KICK (36)
      case 36: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

        gain.gain.setValueAtTime(1.0 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      // SNARE (38) & CLAP (39)
      case 38:
      case 39: {
        // Tonal body
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
        oscGain.gain.setValueAtTime(0.7 * gainRatio, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);

        // Snappy noise
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85 * gainRatio, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.22);
        break;
      }

      // CLOSED HI-HAT (42)
      case 42: {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(9000, now);
        filter.Q.setValueAtTime(4.0, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.65 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.06);
        break;
      }

      // OPEN HI-HAT (46)
      case 46: {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.65 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.45);
        break;
      }

      // LOW / FLOOR TOM (45)
      case 45: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.28);
        gain.gain.setValueAtTime(0.9 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      // MID TOM (47)
      case 47: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.25);
        gain.gain.setValueAtTime(0.9 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      // HIGH TOM (50)
      case 50: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.22);
        gain.gain.setValueAtTime(0.9 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }

      // CRASH (49) & SPLASH (55)
      case 49:
      case 55: {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(note === 55 ? 5500 : 3800, now);
        const gain = ctx.createGain();
        const decay = note === 55 ? 0.6 : 1.2;
        gain.gain.setValueAtTime(0.75 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + decay);
        break;
      }

      // RIDE (51), RIDE BELL (53) & CHINA (52)
      case 51:
      case 53:
      case 52: {
        // Metallic harmonics
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note === 53 ? 840 : 560, now);
        oscGain.gain.setValueAtTime((note === 53 ? 0.8 : 0.4) * gainRatio, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);

        // Cymbal shimmer
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(7500, now);
        filter.Q.setValueAtTime(3.0, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55 * gainRatio, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.9);
        break;
      }

      // COWBELL (56)
      case 56: {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(587, now);
        osc2.frequency.setValueAtTime(845, now);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.7 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
        break;
      }

      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.5 * gainRatio, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  } catch (err) {
    console.warn('[AudioSynth] Error playing sound:', err);
  }
};
