// Downloads the quantised KB-Whisper tiny model into public/models/kb-whisper-tiny/.
// Model files are git-ignored; run `npm run fetch-model` before `npm run build`.

import { mkdir, rename, stat, rm, copyFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const REPO = 'KBLab/kb-whisper-tiny';
const BASE_URL = `https://huggingface.co/${REPO}/resolve/main/`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'models', 'kb-whisper-tiny');
const ORT_OUT_DIR = join(ROOT, 'public', 'models', 'ort');

// ONNX Runtime WASM pair used by transformers.js in Chrome; self-hosted so
// the runtime never loads from a CDN.
const ORT_FILES = ['ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm'];

const FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'special_tokens_map.json',
  'added_tokens.json',
  'normalizer.json',
  'merges.txt',
  'vocab.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function download(file) {
  const dest = join(OUT_DIR, file);
  if (await exists(dest)) {
    console.log(`skip  ${file} (already present)`);
    return;
  }

  await mkdir(dirname(dest), { recursive: true });
  const partPath = `${dest}.part`;
  console.log(`fetch ${file}`);

  const res = await fetch(BASE_URL + file);
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} for ${file}`);
  }

  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(partPath));
    await rename(partPath, dest);
  } catch (err) {
    await rm(partPath, { force: true });
    throw err;
  }
}

async function copyOrtRuntime() {
  const requireFromTransformers = createRequire(
    join(ROOT, 'node_modules', '@huggingface', 'transformers', 'package.json'),
  );
  await mkdir(ORT_OUT_DIR, { recursive: true });
  for (const file of ORT_FILES) {
    const dest = join(ORT_OUT_DIR, file);
    if (await exists(dest)) {
      console.log(`skip  ${file} (already present)`);
      continue;
    }
    const src = requireFromTransformers.resolve(`onnxruntime-web/${file}`);
    await copyFile(src, dest);
    console.log(`copy  ${file}`);
  }
}

async function main() {
  for (const file of FILES) {
    await download(file);
  }
  await copyOrtRuntime();
  console.log(`Model ready in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(`fetch-model failed: ${err.message}`);
  process.exit(1);
});
