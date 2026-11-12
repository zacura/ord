export const VAD_DEFAULTS = Object.freeze({
  sampleRate: 16000,
  // Leading audio used to estimate the noise floor; assumed to contain no speech.
  calibrationMs: 500,
  // Speech must be this many times louder (RMS) than the noise floor.
  snrRatio: 3,
  // Absolute RMS gate so a silent room does not trigger on hiss.
  minThreshold: 0.01,
  // Idle floor adapts this fraction per chunk, only while nothing is voiced.
  floorSmoothing: 0.05,
  preRollMs: 200,
  hangoverMs: 300,
  minUtteranceMs: 250,
  maxUtteranceMs: 4000,
});

export function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function concat(chunks, length) {
  const out = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Energy-gated voice activity detector. push(chunk) returns a Float32Array utterance when one ends,
// otherwise null. Chunks are mono samples at options.sampleRate.
export class VoiceActivityDetector {
  constructor(options = {}) {
    this.options = { ...VAD_DEFAULTS, ...options };
    this.toSamples = (ms) => Math.round((ms * this.options.sampleRate) / 1000);
    this.reset();
  }

  reset() {
    this.calibration = { energies: [], samples: 0 };
    this.noiseFloor = null;
    this.preRoll = [];
    this.preRollSamples = 0;
    this.utterance = null;
    this.utteranceSamples = 0;
    this.voicedSamples = 0;
    this.silentSamples = 0;
  }

  get threshold() {
    return Math.max(this.noiseFloor * this.options.snrRatio, this.options.minThreshold);
  }

  push(chunk) {
    const energy = rms(chunk);

    if (this.noiseFloor === null) {
      this.calibration.energies.push(energy);
      this.calibration.samples += chunk.length;
      if (this.calibration.samples >= this.toSamples(this.options.calibrationMs)) {
        this.noiseFloor = median(this.calibration.energies);
      }
      return null;
    }

    const voiced = energy > this.threshold;
    if (!this.utterance) {
      if (!voiced) {
        this.noiseFloor += (energy - this.noiseFloor) * this.options.floorSmoothing;
        this.addPreRoll(chunk);
        return null;
      }
      this.startUtterance();
    }

    this.utterance.push(chunk);
    this.utteranceSamples += chunk.length;
    if (voiced) {
      this.voicedSamples += chunk.length;
      this.silentSamples = 0;
    } else {
      this.silentSamples += chunk.length;
    }

    const ended = this.silentSamples >= this.toSamples(this.options.hangoverMs);
    const tooLong = this.utteranceSamples >= this.toSamples(this.options.maxUtteranceMs);
    return ended || tooLong ? this.finishUtterance() : null;
  }

  addPreRoll(chunk) {
    this.preRoll.push(chunk);
    this.preRollSamples += chunk.length;
    const limit = this.toSamples(this.options.preRollMs);
    while (this.preRoll.length && this.preRollSamples - this.preRoll[0].length >= limit) {
      this.preRollSamples -= this.preRoll.shift().length;
    }
  }

  startUtterance() {
    this.utterance = this.preRoll;
    this.utteranceSamples = this.preRollSamples;
    this.voicedSamples = 0;
    this.silentSamples = 0;
    this.preRoll = [];
    this.preRollSamples = 0;
  }

  finishUtterance() {
    const chunks = this.utterance;
    const length = this.utteranceSamples;
    const voiced = this.voicedSamples;
    this.utterance = null;
    this.utteranceSamples = 0;
    this.voicedSamples = 0;
    this.silentSamples = 0;

    if (voiced < this.toSamples(this.options.minUtteranceMs)) return null;
    return concat(chunks, length);
  }
}
