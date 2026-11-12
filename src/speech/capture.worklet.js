// Runs in the AudioWorkletGlobalScope. Converts the context's native rate to 16 kHz mono
// and posts fixed-size Float32Array chunks to the main thread.
const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 512;

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.step = sampleRate / TARGET_RATE;
    this.pending = new Float32Array(0);
    // Absolute input index of pending[0], and the absolute input position of the next output sample.
    this.base = 0;
    this.position = 0;
    this.chunk = new Float32Array(CHUNK_SAMPLES);
    this.filled = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    const merged = new Float32Array(this.pending.length + input.length);
    merged.set(this.pending);
    merged.set(input, this.pending.length);
    this.pending = merged;

    // Linear interpolation between neighbouring input samples.
    while (true) {
      const index = Math.floor(this.position) - this.base;
      if (index + 1 >= this.pending.length) break;

      const fraction = this.position - Math.floor(this.position);
      const sample = this.pending[index] * (1 - fraction) + this.pending[index + 1] * fraction;
      this.chunk[this.filled++] = sample;
      if (this.filled === CHUNK_SAMPLES) this.flush();
      this.position += this.step;
    }

    const drop = Math.floor(this.position) - this.base;
    if (drop > 0) {
      this.pending = this.pending.slice(drop);
      this.base += drop;
    }
    return true;
  }

  flush() {
    const out = this.chunk;
    this.chunk = new Float32Array(CHUNK_SAMPLES);
    this.filled = 0;
    this.port.postMessage(out, [out.buffer]);
  }
}

registerProcessor('capture-processor', CaptureProcessor);
