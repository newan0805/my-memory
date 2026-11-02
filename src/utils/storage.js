// All app data lives in localStorage. To survive updates, storage eviction and
// reinstalls we (1) ask the browser for persistent storage, (2) mirror every key
// into IndexedDB and restore from it when localStorage comes back empty, and
// (3) let the user export/import a JSON backup file — the only thing that
// survives uninstalling the PWA.

export const DATA_KEYS = ['userProfile', 'userName', 'schedules', 'todos', 'subtasks', 'preferences', 'sidebarCollapsed', 'todoRemindersEnabled'];
// Caches that are safe to lose; cleared with the rest of the data but never backed up.
const CACHE_KEYS = ['weatherCache', 'quoteQueue', 'dateFilters'];
const LAST_BACKUP_KEY = 'lastBackupAt';

const BACKUP_APP = 'my-memory';
const BACKUP_VERSION = 1;

const DB_NAME = 'my-memory';
const DB_STORE = 'snapshots';
const SNAPSHOT_ID = 'latest';

// ---------- IndexedDB mirror ----------

const openDb = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const idb = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, mode);
    const req = fn(tx.objectStore(DB_STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

const readLocalData = () => Object.fromEntries(
  DATA_KEYS.map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)
);

let lastSnapshot = null;

export const saveSnapshot = async () => {
  const data = readLocalData();
  const serialized = JSON.stringify(data);
  if (serialized === lastSnapshot) return;
  try {
    await idb('readwrite', (store) => store.put({ data, savedAt: Date.now() }, SNAPSHOT_ID));
    lastSnapshot = serialized;
  } catch {
    // IndexedDB can be unavailable (private mode); the JSON backup still works.
  }
};

// Called before the app renders: if localStorage lost the profile but IndexedDB still has it, put it back.
export const restoreFromSnapshot = async () => {
  if (localStorage.getItem('userProfile')) return false;
  try {
    const snapshot = await idb('readonly', (store) => store.get(SNAPSHOT_ID));
    if (!snapshot?.data?.userProfile) return false;
    Object.entries(snapshot.data).forEach(([key, value]) => localStorage.setItem(key, value));
    lastSnapshot = JSON.stringify(snapshot.data);
    return true;
  } catch {
    return false;
  }
};

// localStorage has no same-tab change event, so mirror periodically and whenever the app is hidden/closed.
export const startAutoSnapshot = () => {
  saveSnapshot();
  const timer = setInterval(saveSnapshot, 15000);
  const onHide = () => { if (document.visibilityState === 'hidden') saveSnapshot(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', saveSnapshot);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', saveSnapshot);
  };
};

// ---------- Persistent storage ----------

export const requestPersistentStorage = async () => {
  if (!navigator.storage?.persist) return null;
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return null;
  }
};

export const isStoragePersisted = async () => {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
};

// ---------- Export / import ----------

const parse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const buildBackup = () => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  data: Object.fromEntries(Object.entries(readLocalData()).map(([key, value]) => [key, parse(value)])),
});

export const getLastBackupAt = () => Number(localStorage.getItem(LAST_BACKUP_KEY)) || null;

// Mobile (incl. installed PWAs) gets the share sheet so the file can go to Files/Drive/email;
// desktop gets a normal download.
export const exportBackup = async () => {
  const backup = buildBackup();
  const date = backup.exportedAt.slice(0, 10);
  const fileName = `my-memory-backup-${date}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My Memory backup' });
      localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Fall through to a download if sharing fails for any other reason.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
  return 'downloaded';
};

// Validates a backup file and returns a summary without changing anything.
export const readBackupFile = async (file) => {
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (backup?.app !== BACKUP_APP || typeof backup.data !== 'object' || !backup.data) {
    throw new Error('That file is not a My Memory backup.');
  }
  if (backup.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app. Update the app first.');
  }
  if (!backup.data.userProfile?.firstName) {
    throw new Error('This backup has no profile in it.');
  }
  const count = (key) => (Array.isArray(backup.data[key]) ? backup.data[key].length : 0);
  return {
    backup,
    summary: {
      exportedAt: backup.exportedAt,
      name: [backup.data.userProfile.firstName, backup.data.userProfile.lastName].filter(Boolean).join(' '),
      todos: count('todos'),
      schedules: count('schedules'),
      subtasks: count('subtasks'),
    },
  };
};

// ---------- Import (merge or replace) ----------

const LIST_KEYS = ['todos', 'schedules', 'subtasks'];
const UNDO_ID = 'beforeImport';

const readCurrentParsed = () => Object.fromEntries(Object.entries(readLocalData()).map(([key, value]) => [key, parse(value)]));

const isValidItem = (item) => item && typeof item === 'object' && !Array.isArray(item) && item.id != null && typeof item.title === 'string';

// Two records with the same id are "the same item" only if they also look alike;
// otherwise it's an id clash between unrelated items (ids are timestamps, so clashes are possible across devices).
const sameItem = (a, b, key) => {
  if (key === 'subtasks') return a.scheduleId === b.scheduleId;
  if (key === 'schedules') return a.title === b.title || a.date === b.date;
  return a.title === b.title || a.dueDate === b.dueDate;
};

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Content without the id: lets a re-import recognise items that were renumbered by an earlier import.
const signature = (item) => JSON.stringify({ ...item, id: undefined });

let idCounter = 0;
const freshId = (taken) => {
  let id = Math.max(Date.now(), idCounter + 1);
  while (taken.has(id)) id += 1;
  idCounter = id;
  taken.add(id);
  return id;
};

/*
 * Works out the result of an import without writing anything.
 * merge:   keeps everything on this device and adds what's new from the file. When the same item exists in both,
 *          this device's version wins. Unrelated items with clashing ids get a new id (and their subtasks follow).
 * replace: the file's data replaces this device's.
 */
export const planImport = (backup, mode = 'merge') => {
  const current = readCurrentParsed();
  const incoming = backup.data;
  const stats = { added: {}, unchanged: {}, conflicts: {}, renumbered: 0, skipped: 0 };
  const result = {};

  if (mode === 'replace') {
    DATA_KEYS.forEach((key) => { if (incoming[key] !== undefined) result[key] = incoming[key]; });
    LIST_KEYS.forEach((key) => {
      const list = Array.isArray(incoming[key]) ? incoming[key] : [];
      result[key] = list.filter(isValidItem);
      stats.skipped += list.length - result[key].length;
      stats.added[key] = result[key].length;
    });
  } else {
    // Profile, preferences etc.: this device's values win; the file only fills in what's missing.
    result.userProfile = current.userProfile || incoming.userProfile;
    result.userName = current.userName || incoming.userName || result.userProfile?.firstName;
    result.preferences = { ...(incoming.preferences || {}), ...(current.preferences || {}) };
    if (current.sidebarCollapsed !== undefined || incoming.sidebarCollapsed !== undefined) {
      result.sidebarCollapsed = current.sidebarCollapsed ?? incoming.sidebarCollapsed;
    }

    const scheduleIdMap = new Map(); // incoming schedule id -> id used after merge
    // Schedules first so subtasks can follow any renumbered schedule.
    ['schedules', 'todos', 'subtasks'].forEach((key) => {
      const mine = (Array.isArray(current[key]) ? current[key] : []).filter(isValidItem);
      const byId = new Map(mine.map((item) => [item.id, item]));
      const bySignature = new Map(mine.map((item) => [signature(item), item]));
      const taken = new Set(mine.map((item) => item.id));
      const merged = [...mine];
      stats.added[key] = 0; stats.unchanged[key] = 0; stats.conflicts[key] = 0;

      (Array.isArray(incoming[key]) ? incoming[key] : []).forEach((raw) => {
        if (!isValidItem(raw)) { stats.skipped += 1; return; }
        let item = raw;
        if (key === 'subtasks') {
          const scheduleId = scheduleIdMap.has(item.scheduleId) ? scheduleIdMap.get(item.scheduleId) : item.scheduleId;
          // Orphans (their schedule isn't in either data set) are skipped, not counted as added.
          if (!result.schedules.some((sch) => sch.id === scheduleId)) { stats.skipped += 1; return; }
          item = { ...item, scheduleId };
        }
        const existing = byId.get(item.id);
        const twin = bySignature.get(signature(item));
        if (twin && !(existing && sameItem(existing, item, key))) {
          // Identical item already here under another id (imported before): nothing to add.
          stats.unchanged[key] += 1;
          if (key === 'schedules') scheduleIdMap.set(raw.id, twin.id);
          return;
        }
        if (existing && sameItem(existing, item, key)) {
          if (equal(existing, item)) stats.unchanged[key] += 1;
          else stats.conflicts[key] += 1; // keep this device's version
          if (key === 'schedules') scheduleIdMap.set(raw.id, existing.id);
          return;
        }
        if (existing) {
          // Unrelated item that happens to share an id: keep both.
          const id = freshId(taken);
          if (key === 'schedules') scheduleIdMap.set(raw.id, id);
          item = { ...item, id };
          stats.renumbered += 1;
        } else {
          taken.add(item.id);
          if (key === 'schedules') scheduleIdMap.set(raw.id, item.id);
        }
        byId.set(item.id, item);
        bySignature.set(signature(item), item);
        merged.push(item);
        stats.added[key] += 1;
      });
      result[key] = merged;
    });
  }

  // Never keep subtasks whose schedule doesn't exist.
  const scheduleIds = new Set((result.schedules || []).map((s) => s.id));
  const before = (result.subtasks || []).length;
  result.subtasks = (result.subtasks || []).filter((st) => scheduleIds.has(st.scheduleId));
  stats.skipped += before - result.subtasks.length;

  return { mode, result, stats };
};

const writeData = (data) => {
  DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  Object.entries(data).forEach(([key, value]) => {
    if (!DATA_KEYS.includes(key) || value === undefined || value === null) return;
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
};

// Applies a plan atomically: on any failure (e.g. storage full) the previous data is put back untouched.
// The previous data is also kept in IndexedDB so the import can be undone.
export const applyImport = async ({ result }) => {
  const previous = readLocalData();
  try {
    await idb('readwrite', (store) => store.put({ data: previous, savedAt: Date.now() }, UNDO_ID));
  } catch {
    // Undo just won't be available.
  }
  try {
    writeData(result);
  } catch (err) {
    DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    Object.entries(previous).forEach(([key, value]) => localStorage.setItem(key, value));
    throw new Error(err?.name === 'QuotaExceededError' ? 'Not enough storage space to import this backup.' : 'Import failed — nothing was changed.');
  }
  CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
  lastSnapshot = null;
  await saveSnapshot();
};

export const getUndoInfo = async () => {
  try {
    const undo = await idb('readonly', (store) => store.get(UNDO_ID));
    return undo ? { savedAt: undo.savedAt } : null;
  } catch {
    return null;
  }
};

export const undoImport = async () => {
  const undo = await idb('readonly', (store) => store.get(UNDO_ID));
  if (!undo) throw new Error('Nothing to undo.');
  writeData(undo.data);
  await idb('readwrite', (store) => store.delete(UNDO_ID));
  lastSnapshot = null;
  await saveSnapshot();
};

// Wipes localStorage data *and* the IndexedDB mirror (otherwise it would be restored on next launch).
export const clearAllData = async () => {
  [...DATA_KEYS, ...CACHE_KEYS, LAST_BACKUP_KEY].forEach((key) => localStorage.removeItem(key));
  lastSnapshot = null;
  try {
    await idb('readwrite', (store) => { store.delete(UNDO_ID); return store.delete(SNAPSHOT_ID); });
  } catch {
    // Nothing to clear.
  }
};
