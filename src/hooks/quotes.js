// ZenQuotes doesn't send CORS headers, so it's reached through /api/quotes
// (Vite proxy in dev, vercel.json rewrite in production).
const QUOTES_URL = '/api/quotes';
const STORAGE_KEY = 'quoteQueue';
// Refill once only this many quotes are left (i.e. when we hand out the one before the last).
const REFILL_AT = 1;

const FALLBACK_QUOTES = [
  { q: 'You got this! One task at a time.', a: 'Your pet' },
  { q: 'Remember to drink some water.', a: 'Your pet' },
  { q: 'Small steps every day add up.', a: 'Your pet' },
];

// ZenQuotes allows ~5 requests per 30s; after a failure or rate limit, wait before trying again.
const RETRY_AFTER = 60 * 1000;
let refilling = null;
let blockedUntil = 0;

const readQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeQueue = (queue) => localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

// Fetches a fresh batch and appends it to the cached queue (skipping duplicates).
export const refillQuotes = () => {
  if (refilling) return refilling;
  if (Date.now() < blockedUntil) return Promise.resolve();
  refilling = fetch(QUOTES_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Quotes request failed (${res.status})`);
      return res.json();
    })
    .then((batch) => {
      // When rate limited, ZenQuotes returns a single notice "quote" authored by zenquotes.io.
      const fresh = (Array.isArray(batch) ? batch : [])
        .filter((item) => item?.q && item.a && item.a !== 'zenquotes.io')
        .map(({ q, a }) => ({ q, a }));
      const queue = readQueue();
      const seen = new Set(queue.map((item) => item.q));
      writeQueue([...queue, ...fresh.filter((item) => !seen.has(item.q))]);
    })
    .catch(() => { blockedUntil = Date.now() + RETRY_AFTER; })
    .finally(() => { refilling = null; });
  return refilling;
};

// Pre-loads quotes only when the cache is (nearly) empty — safe to call on every page load.
export const ensureQuotes = () => (readQueue().length <= REFILL_AT ? refillQuotes() : Promise.resolve());

// Takes the next cached quote; triggers a background refill when the cache runs low.
export const nextQuote = async () => {
  let queue = readQueue();
  if (queue.length === 0) {
    await refillQuotes();
    queue = readQueue();
  }
  if (queue.length === 0) return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];

  const [quote, ...rest] = queue;
  writeQueue(rest);
  if (rest.length <= REFILL_AT) refillQuotes();
  return quote;
};
