# Ord – learn to read Swedish

A mobile browser game for learning to read Swedish. One Swedish word is shown at a time; say it aloud before the 10-second timer runs out. Built with [PixiJS](https://pixijs.com/) v8 on top of Vite and npm.

The game renders into a single full-screen canvas laid out on a virtual 360×640 portrait stage that scales to fit any screen. Scene code lives in `src/scenes/`, and the layout helper is in `src/layout.js`.

## Development

```sh
npm install
npm run dev
```

To open the dev server on a phone on the same network, use the network URL printed by Vite.

## Build

```sh
npm run build
npm run preview
```
