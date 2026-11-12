// One shared microphone stream for a round. Opened from a user gesture and kept until released,
// so repeated words do not re-prompt or reopen the device.
const MIC_CONSTRAINTS = {
  audio: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  },
};

let stream = null;
let pending = null;
// Bumped on release so a getUserMedia call that resolves after release is closed, not leaked.
let generation = 0;

export function isMicStreamLive() {
  return Boolean(stream?.active);
}

export function acquireMicStream() {
  if (isMicStreamLive()) return Promise.resolve(stream);
  if (pending) return pending;

  const requestedGeneration = generation;
  const request = navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS).then(
    (acquired) => {
      if (requestedGeneration !== generation) {
        acquired.getTracks().forEach((track) => track.stop());
        throw new DOMException('Microphone was released before it opened', 'AbortError');
      }
      stream = acquired;
      pending = null;
      return acquired;
    },
    (error) => {
      if (requestedGeneration === generation) pending = null;
      throw error;
    },
  );
  pending = request;
  return request;
}

export function releaseMicStream() {
  generation += 1;
  pending = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}
