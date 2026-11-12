import captureWorkletUrl from './capture.worklet.js?url';

let context = null;
const workletLoads = new WeakMap();

// Creates the context if needed and resumes it. Call synchronously from a user gesture (the Start tap),
// since mobile browsers keep a context suspended until one happens.
export function unlockAudio() {
  context ??= new AudioContext();
  return context.resume();
}

function loadWorklet(audioContext) {
  if (!workletLoads.has(audioContext)) {
    workletLoads.set(audioContext, audioContext.audioWorklet.addModule(captureWorkletUrl));
  }
  return workletLoads.get(audioContext);
}

// Streams 16 kHz mono Float32Array chunks from a MediaStream to onChunk. The stream is owned by the caller.
export class AudioCapture {
  constructor({ onChunk = null } = {}) {
    this.onChunk = onChunk;
    this.nodes = [];
    this.token = null;
  }

  async start(stream) {
    this.stop();
    const token = {};
    this.token = token;

    unlockAudio();
    await loadWorklet(context);
    if (this.token !== token) return;

    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, 'capture-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    // The worklet only runs while it has an output connected; a silent gain keeps the mic out of the speakers.
    const mute = context.createGain();
    mute.gain.value = 0;

    node.port.onmessage = (event) => this.onChunk?.(event.data);
    source.connect(node);
    node.connect(mute);
    mute.connect(context.destination);
    this.nodes = [source, node, mute];
  }

  stop() {
    this.token = null;
    for (const node of this.nodes) {
      if (node.port) node.port.onmessage = null;
      node.disconnect();
    }
    this.nodes = [];
  }
}
