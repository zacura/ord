export const MIC_MESSAGES = {
  denied:
    'Microphone access is blocked. Allow it in your browser settings, or tap "I said it" after saying the word.',
  unavailable:
    'Speech recognition is not available here. Tap "I said it" after saying the word.',
};

// Must be called synchronously from a user gesture (the Start tap) so the browser shows the prompt.
export async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (error) {
    return error.name === 'NotAllowedError' || error.name === 'SecurityError' ? 'denied' : 'unavailable';
  }
}
