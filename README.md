# Ord – learn to read Swedish

A mobile browser game for learning to read Swedish. One Swedish word is shown at a time; say it aloud before the 10-second timer runs out. Built with [PixiJS](https://pixijs.com/) v8 on top of Vite and npm.

The game renders into a single full-screen canvas laid out on a virtual 360×640 portrait stage that scales to fit any screen. Scene code lives in `src/scenes/`, and the layout helper is in `src/layout.js`.

## Development

```sh
npm install
npm run dev
```

To open the dev server on a phone on the same network, use the network URL printed by Vite. The dev server uses a self-signed HTTPS certificate (via `@vitejs/plugin-basic-ssl`) because browsers only grant microphone access on HTTPS or `localhost`; accept the certificate warning once on the phone.

## Build

```sh
npm run build
npm run preview
```

`npm run build` writes static files to `dist/`. Asset URLs are relative, so the output can be served from a domain root or a subpath.

## Deploy

The game is plain static files and must be served over HTTPS for microphone access. Any static host works:

- **GitHub Pages:** the workflow in `.github/workflows/pages.yml` runs `npm ci`, `npm test` and `npm run build` on every push to `master` and deploys `dist/`. Pages must be enabled for the repo (the workflow turns it on with `actions/configure-pages`, `enablement: true`). Pages for private repos requires a paid GitHub plan.
- **Netlify:** connect the repo with build command `npm run build` and publish directory `dist`.
- **Manual:** run `npm run build` and upload the contents of `dist/` to any HTTPS host.

Opening the site on a phone then lets you use *Add to Home Screen* (Android Chrome: menu → *Install app*; iOS Safari: Share → *Add to Home Screen*) to install it as a standalone app.

## Offline play

In production builds, `public/sw.js` caches the game files after the first visit, so the game loads without a network connection. A new deployment is picked up on the next visit (navigations are network-first).

The speech model is cached separately, on first use rather than at install time. After one online visit (where the model is downloaded from the menu), Whisper works offline, including in airplane mode. The browser is asked for persistent storage on the first tap so the model is not evicted. Without a model, or with the recognizer, the game falls back to the *I said it* self-report button.

## Speech recognition

Chrome on Android plays a beep every time the built-in `SpeechRecognition` starts or stops, and there is no web API to turn that off. The game restarts the recognizer after silence, so the beeps repeat for every word. To avoid this, the default detector runs a small Swedish Whisper model fully in the browser: the microphone is captured with `getUserMedia` (which makes no sound), a voice-activity detector cuts it into utterances, and the model transcribes each one in a Web Worker.

- **Download size:** about 147 MB (the quantised ONNX model, roughly 120 MB, plus about 26 MB of ONNX Runtime WASM). It is downloaded once, from the menu, and cached for offline use.
- **Detector order:** Whisper → `SpeechRecognition` → *I said it* button. Force one with `?detector=whisper`, `?detector=native` or `?detector=manual`.
- **Model files are not committed.** Run `npm run fetch-model` once to download them into `public/models/` before `npm run build` or a dev session that needs the model. The GitHub Pages workflow runs it automatically.

## Speech model license

The on-device speech model is [`KBLab/kb-whisper-tiny`](https://huggingface.co/KBLab/kb-whisper-tiny) from the National Library of Sweden (KBLab), a Swedish fine-tune of `openai/whisper-tiny`. It is licensed under the **Apache License 2.0**. Its model files are downloaded at development and build time and are not committed to this repository.
