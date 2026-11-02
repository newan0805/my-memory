import { useState, useEffect } from 'react';

const CACHE_KEY = 'weatherCache';
const CACHE_TTL = 30 * 60 * 1000;

// Fallback (capital city) when the user hasn't entered a city or it can't be found.
const COUNTRY_CAPITALS = {
  US: 'Washington', UK: 'London', CA: 'Ottawa', AU: 'Canberra', IN: 'New Delhi',
  LK: 'Colombo', JP: 'Tokyo', DE: 'Berlin', FR: 'Paris', SG: 'Singapore',
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

export const CONDITION_LABELS = {
  clear: 'Clear',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorm',
};

// Open-Meteo geocoding + forecast: free, no API key.
const geocode = async (name, countryCode) => {
  const params = new URLSearchParams({ name, count: '1', language: 'en', format: 'json' });
  if (countryCode) params.set('countryCode', countryCode);
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const { results } = await res.json();
  return results?.[0] || null;
};

const locate = async (city, country) => {
  const iso = toIsoCountry(country);
  const place = (city && await geocode(city.trim(), iso)) || (COUNTRY_CAPITALS[country] && await geocode(COUNTRY_CAPITALS[country], iso));
  if (!place) throw new Error('Location not found');
  return { lat: place.latitude, lon: place.longitude, name: [place.name, place.country_code].filter(Boolean).join(', ') };
};

const cacheKeyFor = (city, country) => `${(city || '').trim().toLowerCase()}|${country || ''}`;

const readCache = (key) => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached && cached.key === key && Date.now() - cached.fetchedAt < CACHE_TTL ? cached : null;
  } catch {
    return null;
  }
};

function useWeather(city, country, enabled = true) {
  const key = cacheKeyFor(city, country);
  const [weather, setWeather] = useState(() => readCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const cached = readCache(key);
    if (cached) {
      setWeather(cached);
      return;
    }
    if (!city && !country) {
      setError('Add your city in Profile to see the weather');
      return;
    }
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const location = await locate(city, country);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code,is_day`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
        const { current } = await res.json();
        const data = {
          key,
          temperature: Math.round(current.temperature_2m),
          condition: getCondition(current.weather_code),
          isDay: current.is_day === 1,
          location: location.name,
          fetchedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        if (!cancelled) setWeather(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [key, city, country, enabled]);

  return { weather, error };
}

export default useWeather;
