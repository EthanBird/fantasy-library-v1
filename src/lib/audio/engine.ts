/**
 * 空间音频引擎
 * 使用 Web Audio API 创建：
 *   - 1 个 AudioContext
 *   - N 个 PannerNode 跟随 3D 位置的环境音源
 *   - 主音量 GainNode
 */

export type ReverbPreset = 'cathedral' | 'wood' | 'crystal' | 'lab' | 'void' | 'modern' | 'none';

interface AmbientTrack {
  id: string;
  buffer: AudioBuffer;
  source: AudioBufferSourceNode;
  panner: PannerNode;
  gain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private tracks: Map<string, AmbientTrack> = new Map();
  private listener: AudioListener | null = null;
  private muted = false;
  private reverbBuffer: AudioBuffer | null = null;
  private reverbNode: ConvolverNode | null = null;
  private currentPreset: ReverbPreset = 'none';

  init(): void {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.6;
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.listener = this.ctx.listener;
      if (this.listener.forwardX) {
        // 现代 API
        this.listener.forwardX.value = 0;
        this.listener.forwardY.value = 0;
        this.listener.forwardZ.value = -1;
        this.listener.upX.value = 0;
        this.listener.upY.value = 1;
        this.listener.upZ.value = 0;
      }
    } catch (e) {
      console.warn('[AudioEngine] init failed', e);
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMaster(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : v;
  }
  setAmbient(v: number): void {
    if (this.ambientGain) this.ambientGain.gain.value = v;
  }
  setSfx(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
  setMuted(m: boolean): void {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.7;
  }

  updateListener(pos: [number, number, number], forward: [number, number, number]): void {
    if (!this.ctx || !this.listener) return;
    const [x, y, z] = pos;
    const [fx, fy, fz] = forward;
    if (this.listener.positionX) {
      this.listener.positionX.value = x;
      this.listener.positionY.value = y;
      this.listener.positionZ.value = z;
      this.listener.forwardX.value = fx;
      this.listener.forwardY.value = fy;
      this.listener.forwardZ.value = fz;
    } else {
      // 兼容旧 API
      (this.listener as any).setPosition(x, y, z);
      (this.listener as any).setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  /**
   * 创建合成式环境音
   * 用 OscillatorNode + FilterNode + LFO 模拟
   */
  createSyntheticAmbient(opts: {
    id: string;
    position: [number, number, number];
    baseFreq: number;
    harmonics: number;
    filterFreq: number;
    filterQ: number;
    lfoRate: number;
    lfoDepth: number;
    volume: number;
  }): void {
    if (!this.ctx || !this.ambientGain) return;
    if (this.tracks.has(opts.id)) return;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    panner.maxDistance = 30;
    panner.rolloffFactor = 1.5;
    panner.positionX.value = opts.position[0];
    panner.positionY.value = opts.position[1];
    panner.positionZ.value = opts.position[2];

    const gain = this.ctx.createGain();
    gain.gain.value = opts.volume;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.filterFreq;
    filter.Q.value = opts.filterQ;

    // 主振荡
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = opts.baseFreq;

    // 谐波
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = opts.baseFreq * opts.harmonics;

    // LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = opts.lfoRate;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = opts.lfoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = 0.3;

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.reverbNode ?? this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();

    // 注意：合成"音轨"没有 source 概念，这里用闭包保留引用
    this.tracks.set(opts.id, {
      id: opts.id,
      buffer: null as any,
      source: null as any,
      panner,
      gain,
    });
  }

  setTrackPosition(id: string, pos: [number, number, number]): void {
    const t = this.tracks.get(id);
    if (!t || !t.panner) return;
    t.panner.positionX.value = pos[0];
    t.panner.positionY.value = pos[1];
    t.panner.positionZ.value = pos[2];
  }

  setTrackVolume(id: string, v: number): void {
    const t = this.tracks.get(id);
    if (!t) return;
    t.gain.gain.value = v;
  }

  removeTrack(id: string): void {
    this.tracks.delete(id);
  }

  setReverb(preset: ReverbPreset): void {
    if (!this.ctx || !this.ambientGain) return;
    if (preset === this.currentPreset) return;
    this.currentPreset = preset;

    if (preset === 'none') {
      if (this.reverbNode) this.reverbNode.disconnect();
      this.reverbNode = null;
      return;
    }
    // 生成合成的 IR
    const seconds = preset === 'cathedral' ? 4 : preset === 'void' ? 5 : preset === 'wood' ? 1.5 : 2;
    const decay = preset === 'cathedral' ? 2 : preset === 'void' ? 1.5 : 3;
    const ir = this.createSyntheticIR(seconds, decay);
    if (!this.reverbNode) this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = ir;
    this.reverbNode.connect(this.ambientGain);
  }

  private createSyntheticIR(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  /**
   * 合成式 SFX（取书/翻页/合书）
   */
  playSfx(kind: 'take' | 'page' | 'close' | 'unlock' | 'portal' | 'hover'): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    const cfgs: Record<typeof kind, { type: OscillatorType; f1: number; f2: number; dur: number; vol: number; filter?: number }> = {
      take: { type: 'triangle', f1: 440, f2: 880, dur: 0.3, vol: 0.5 },
      page: { type: 'sine', f1: 600, f2: 300, dur: 0.15, vol: 0.3 },
      close: { type: 'sine', f1: 400, f2: 200, dur: 0.3, vol: 0.4 },
      unlock: { type: 'triangle', f1: 220, f2: 1320, dur: 1.0, vol: 0.6 },
      portal: { type: 'sawtooth', f1: 80, f2: 1200, dur: 0.7, vol: 0.5 },
      hover: { type: 'sine', f1: 800, f2: 800, dur: 0.05, vol: 0.15 },
    };
    const cfg = cfgs[kind];

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.f1, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.f2, now + cfg.dur);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(cfg.vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.dur);

    if (cfg.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cfg.filter;
      osc.disconnect();
      osc.connect(f);
      f.connect(gain);
    }
    osc.start(now);
    osc.stop(now + cfg.dur);
  }
}

export const audioEngine = new AudioEngine();

// 馆厅到环境音预设的映射
export function ambientConfigForHall(hallId: string): {
  preset: ReverbPreset;
  baseFreq: number;
  harmonics: number;
  filterFreq: number;
  filterQ: number;
  lfoRate: number;
  lfoDepth: number;
  volume: number;
} {
  const configs: Record<string, any> = {
    central: { preset: 'cathedral', baseFreq: 55, harmonics: 1.5, filterFreq: 600, filterQ: 2, lfoRate: 0.1, lfoDepth: 2, volume: 0.15 },
    wood: { preset: 'wood', baseFreq: 110, harmonics: 2, filterFreq: 400, filterQ: 3, lfoRate: 0.3, lfoDepth: 5, volume: 0.2 },
    astro: { preset: 'cathedral', baseFreq: 40, harmonics: 1.3, filterFreq: 500, filterQ: 4, lfoRate: 0.08, lfoDepth: 1, volume: 0.12 },
    crystal: { preset: 'crystal', baseFreq: 220, harmonics: 3, filterFreq: 2000, filterQ: 5, lfoRate: 0.5, lfoDepth: 8, volume: 0.18 },
    alchemy: { preset: 'lab', baseFreq: 80, harmonics: 1.7, filterFreq: 300, filterQ: 4, lfoRate: 0.4, lfoDepth: 3, volume: 0.18 },
    void: { preset: 'void', baseFreq: 30, harmonics: 1.2, filterFreq: 250, filterQ: 6, lfoRate: 0.06, lfoDepth: 0.8, volume: 0.1 },
    real: { preset: 'modern', baseFreq: 0, harmonics: 0, filterFreq: 0, filterQ: 0, lfoRate: 0, lfoDepth: 0, volume: 0 },
  };
  return configs[hallId] ?? configs.central;
}
