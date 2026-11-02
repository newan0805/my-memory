import { useState, useEffect } from 'react';

const CACHE_KEY = 'weatherCache';
const CACHE_TTL = 30 * 60 * 1000;
// After every provider failed, wait this long before trying again (stale data is shown meanwhile).
const RETRY_AFTER = 5 * 60 * 1000;

// Capitals with coordinates: used when the user has no city, or when city lookup fails.
const COUNTRY_CAPITALS = {
  US: { name: 'Washington', lat: 38.9, lon: -77.04 },
  UK: { name: 'London', lat: 51.51, lon: -0.13 },
  CA: { name: 'Ottawa', lat: 45.42, lon: -75.7 },
  AU: { name: 'Canberra', lat: -35.28, lon: 149.13 },
  IN: { name: 'New Delhi', lat: 28.61, lon: 77.21 },
  LK: { name: 'Colombo', lat: 6.93, lon: 79.86 },
  JP: { name: 'Tokyo', lat: 35.68, lon: 139.69 },
  DE: { name: 'Berlin', lat: 52.52, lon: 13.41 },
  FR: { name: 'Paris', lat: 48.86, lon: 2.35 },
  SG: { name: 'Singapore', lat: 1.35, lon: 103.82 },
};

// The app stores "UK"; the geocoder expects ISO 3166-1 codes.
const toIsoCountry = (country) => (country === 'UK' ? 'GB' : country === 'OTHER' ? '' : country || '');

// WMO weather codes -> simplified condition.
export const getCondition = (code) => {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 71 && code <= 77) return 'snow';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  if (code >= 51) return 'rain';
  return 'clear';
};

// MET Norway symbol codes (e.g. "lightrainshowers_day") -> simplified condition.
const getMetCondition = (symbol = '') => {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return 'storm';
  if (s.includes('snow') || s.includes('sleet')) return 'snow';
  if (s.includes('rain')) return 'rain';
  if (s === 'fog') return 'fog';
  if (s === 'cloudy') return 'cloudy';
  if (s === 'partlycloudy' || s === 'fair') return 'partly';
  return 'clear';
};

export const CONDITION_LABELS = {
  clear: 'Clear',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorm',
};

const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${new URL(url).hostname} responded ${res.status}`);
  return res.json();
};

// Open-Meteo geocoding (free, no key).
const geocode = async (name, countryCode) => {
  const params = new URLSearchParams({ name, count: '1', language: 'en', format: 'json' });
  if (countryCode) params.set('countryCode', countryCode);
  const { results } = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const place = results?.[0];
  return place ? { lat: place.latitude, lon: place.longitude, name: [place.name, place.country_code].filter(Boolean).join(', ') } : null;
};

const locate = async (city, country) => {
  const capital = COUNTRY_CAPITALS[country];
  const fallback = capital && { ...capital, name: `${capital.name}, ${toIsoCountry(country)}` };
  if (!city?.trim()) {
    if (fallback) return fallback;
    throw new Error('Add your city in Profile to see the weather');
  }
  try {
    const place = await geocode(city.trim(), toIsoCountry(country));
    if (place) return place;
  } catch {
    // Geocoder down: fall back to the capital below.
  }
  if (fallback) return fallback;
  throw new Error(`Couldn't find "${city}"`);
};

// Providers are tried in order; both are free, need no key and allow browser (CORS) requests.
const PROVIDERS = [
  async ({ lat, lon }) => {
    const { current } = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`);
    return { temperature: Math.round(current.temperature_2m), condition: getCondition(current.weather_code), isDay: current.is_day === 1 };
  },
  async ({ lat, lon }) => {
    // MET Norway asks for coordinates with at most 4 decimals.
    const data = await getJson(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
    const now = data.properties.timeseries[0].data;
    const symbol = now.next_1_hours?.summary?.symbol_code || now.next_6_hours?.summary?.symbol_code || '';
    const hour = new Date().getHours();
    return {
      temperature: Math.round(now.instant.details.air_temperature),
      condition: getMetCondition(symbol),
      isDay: symbol.endsWith('_night') ? false : symbol.endsWith('_day') ? true : hour >= 6 && hour < 18,
    };
  },
];

const cacheKeyFor = (city, country) => `${(city || '').trim().toLowerCase()}|${country || ''}`;

// Returns the cached entry for this location regardless of age (callers decide if it's fresh enough).
const readCache = (key) => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached && cached.key === key ? cached : null;
  } catch {
    return null;
  }
};

const isFresh = (cached) => cached && Date.now() - cached.fetchedAt < CACHE_TTL;

function useWeather(city, country, enabled = true) {
  const key = cacheKeyFor(city, country);
  const [weather, setWeather] = useState(() => readCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const cached = readCache(key);
    setWeather(cached);
    if (isFresh(cached) || (cached?.failedAt && Date.now() - cached.failedAt < RETRY_AFTER)) return;
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const location = await locate(city, country);
        let lastError;
        for (const provider of PROVIDERS) {
          try {
            const current = await provider(location);
            const data = { key, ...current, location: location.name, fetchedAt: Date.now() };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            if (!cancelled) setWeather(data);
            return;
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError;
      } catch (err) {
        if (cancelled) return;
        if (cached) {
          // Keep showing the last known weather (flagged stale) and back off before retrying.
          const stale = { ...cached, stale: true, failedAt: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(stale));
          setWeather(stale);
        } else {
          setError(err.message);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [key, city, country, enabled]);

  return { weather, error };
}

export default useWeather;
