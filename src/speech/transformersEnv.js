import { env } from '@huggingface/transformers';

export const MODEL_ID = 'kb-whisper-tiny';

// baseUrl must be absolute: a worker resolves relative URLs against its own script,
// not the page, so the page should pass its resolved base URL to the worker.
export function configureTransformers(baseUrl) {
  const modelsRoot = new URL('models/', baseUrl).href;
  const ortRoot = `${modelsRoot}ort/`;

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  // transformers.js skips local existence checks when localModelPath looks like a URL,
  // so pass the same-origin path instead of the absolute URL.
  env.localModelPath = new URL(modelsRoot).pathname;
  env.backends.onnx.wasm.wasmPaths = {
    mjs: `${ortRoot}ort-wasm-simd-threaded.asyncify.mjs`,
    wasm: `${ortRoot}ort-wasm-simd-threaded.asyncify.wasm`,
  };
  env.backends.onnx.wasm.numThreads = 1;

  return env;
}
