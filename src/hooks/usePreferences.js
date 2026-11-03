import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'preferences';
const CHANGE_EVENT = 'preferences-change';

export const DEFAULT_PREFERENCES = {
  petId: 'blob',
  petName: '',
  customPetEmoji: '🐢',
  petVisible: true,
  weatherVisible: true,
  timeBackground: true,
  scheduleReminderLeadMinutes: 30,
  dailyBriefingEnabled: false,
  dailyBriefingTime: '07:00',
};

const readPreferences = () => {
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

// Shared across every mounted component (Settings toggles update the Layout instantly).
function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const sync = () => setPreferences(readPreferences());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const updatePreferences = useCallback((changes) => {
    const next = { ...readPreferences(), ...changes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [preferences, updatePreferences];
}

export default usePreferences;
