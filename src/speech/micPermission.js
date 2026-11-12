import { acquireMicStream } from './micStream.js';

export const MIC_MESSAGES = {
  denied:
    'Microphone access is blocked. Allow it in your browser settings, or tap "I said it" after saying the word.',
  unavailable:
    'Speech recognition is not available here. Tap "I said it" after saying the word.',
  loadingModel:
    'The voice model is still loading. Speech recognition listens until it is ready.',
  modelFailed:
    'The voice model could not load on this device. Speech recognition or "I said it" is used instead.',
};

// Must be called synchronously from a user gesture (the Start tap) so the browser shows the prompt.
// The granted stream stays open in micStream.js for the round; it is not stopped here.
export async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';

  try {
    await acquireMicStream();
    return 'granted';
  } catch (error) {
    return error.name === 'NotAllowedError' || error.name === 'SecurityError' ? 'denied' : 'unavailable';
  }
}
