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

In production builds, `public/sw.js` caches the game files after the first visit, so the game loads without a network connection. The speech recognizer in Chrome and Safari may still need a connection; without one the game falls back to the *I said it* self-report button. A new deployment is picked up on the next visit (navigations are network-first).
