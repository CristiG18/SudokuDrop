// Lightweight WebAudio SFX. No assets, no autoplay-policy issues
// because we only resume on user gesture.
let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      (window.AudioContext as typeof AudioContext | undefined) ||
      ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext as
        | typeof AudioContext
        | undefined);
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

function tone(freq: number, dur = 0.18, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(420, 0.05, "square", 0.04),
  drop: () => {
    tone(180, 0.08, "triangle", 0.07);
    tone(120, 0.12, "sine", 0.05, 0.04);
  },
  clear: (combo = 1) => {
    // Chord that climbs with combo
    const base = 520 + combo * 60;
    tone(base, 0.18, "sine", 0.09);
    tone(base * 1.25, 0.18, "sine", 0.07, 0.05);
    tone(base * 1.5, 0.22, "triangle", 0.06, 0.1);
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.08, i * 0.08));
  },
  fail: () => {
    tone(220, 0.18, "sawtooth", 0.06);
    tone(160, 0.24, "sawtooth", 0.06, 0.08);
  },
};
