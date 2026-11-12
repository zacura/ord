const NON_WORD_CHARS = /[^\p{L}\p{N}\s-]/gu;

export function normalize(text) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(NON_WORD_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SWEDISH_VOWELS = /[åäö]/;

// Swapping å/ä/ö for a plain letter (bär → bar) is a real mistake, so it costs two edits and never passes the tolerance.
function substitutionCost(a, b) {
  if (a === b) return 0;
  return SWEDISH_VOWELS.test(a) || SWEDISH_VOWELS.test(b) ? 2 : 1;
}

function levenshtein(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = substitutionCost(a[i - 1], b[j - 1]);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }

  return previous[b.length];
}

// Short words must match exactly, otherwise "bok" would accept "bo".
function allowedDistance(word) {
  if (word.length <= 3) return 0;
  if (word.length <= 6) return 1;
  return 2;
}

export function matchWord(transcript, target) {
  const goal = normalize(target);
  const heard = normalize(transcript);
  if (!goal || !heard) return false;

  const limit = allowedDistance(goal);
  if (levenshtein(heard, goal) <= limit) return true;

  // Accept the word when it is spoken inside a longer phrase, e.g. "en hund".
  return heard.split(' ').some((token) => levenshtein(token, goal) <= limit);
}
