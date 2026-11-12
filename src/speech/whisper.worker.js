import { pipeline } from '@huggingface/transformers';
import { configureTransformers, MODEL_ID } from './transformersEnv.js';
import { filterTranscript } from './filterTranscript.js';

const TRANSCRIBE_OPTIONS = Object.freeze({
  language: 'sv',
  task: 'transcribe',
  return_timestamps: false,
  max_new_tokens: 16,
});

let transcriberPromise = null;
// Chains jobs so only one transcription runs at a time.
let queue = Promise.resolve();

function load(baseUrl) {
  if (!transcriberPromise) {
    configureTransformers(baseUrl);
    transcriberPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (event) => {
        if (event.status === 'progress') {
          self.postMessage({ type: 'progress', file: event.file, progress: event.progress });
        }
      },
    });
  }
  return transcriberPromise;
}

async function transcribe(audio) {
  const transcriber = await transcriberPromise;
  if (!transcriber) throw new Error('model not loaded');

  const output = await transcriber(audio, TRANSCRIBE_OPTIONS);
  const first = Array.isArray(output) ? output[0] : output;
  return filterTranscript(first?.text ?? '');
}

self.onmessage = async (event) => {
  const message = event.data;

  if (message.type === 'load') {
    try {
      await load(message.baseUrl);
      self.postMessage({ type: 'ready' });
    } catch (error) {
      transcriberPromise = null;
      self.postMessage({ type: 'error', message: String(error?.message ?? error) });
    }
    return;
  }

  if (message.type === 'transcribe') {
    const { id, audio } = message;
    queue = queue.then(async () => {
      try {
        const text = await transcribe(audio);
        self.postMessage({ type: 'result', id, text });
      } catch (error) {
        self.postMessage({ type: 'error', id, message: String(error?.message ?? error) });
      }
    });
  }
};
