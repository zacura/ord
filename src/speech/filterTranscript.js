const TAG = /\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g;
const MUSIC_NOTES = /[♪♫♬]/g;
// Whisper repeats one token over and over on silence or noise; a real single word never does.
const MAX_RUN = 3;

// Returns the transcript when it looks like speech, otherwise an empty string.
export function filterTranscript(text) {
  const cleaned = (text ?? '')
    .replace(TAG, ' ')
    .replace(MUSIC_NOTES, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';

  const tokens = cleaned.toLowerCase().split(' ');
  let run = 1;
  for (let i = 1; i < tokens.length; i++) {
    run = tokens[i] === tokens[i - 1] ? run + 1 : 1;
    if (run >= MAX_RUN) return '';
  }

  return cleaned;
}
