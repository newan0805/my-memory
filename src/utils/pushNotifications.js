const DEVICE_ID_KEY = 'todoPushDeviceId';
const DEVICE_TOKEN_KEY = 'todoPushDeviceToken';
const PUSH_ENABLED_KEY = 'todoPushBackendActive';

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const getDeviceCredentials = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  let deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!deviceId || !deviceToken) {
    deviceId = crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    deviceToken = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
  }
  return { deviceId, deviceToken };
};

const getReminderItems = () => {
  const todos = JSON.parse(localStorage.getItem('todos') || '[]');
  const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('preferences') || '{}'); } catch { /* use defaults */ }
  const storedLeadMinutes = preferences.scheduleReminderLeadMinutes;
  const scheduleLeadMinutes = Math.max(0, Math.min(1440, storedLeadMinutes == null ? 30 : Number(storedLeadMinutes) || 0));
  const testReminder = JSON.parse(localStorage.getItem('todoPushTestReminder') || 'null');
  const items = [
    ...todos.filter((todo) => todo.reminder !== false && !todo.completed && todo.dueDate && todo.dueTime)
      .map((todo) => ({ key: `todo-${todo.id}`, title: todo.title, dueAt: new Date(`${todo.dueDate}T${todo.dueTime}`).getTime(), url: '/todos' })),
    ...schedules.filter((schedule) => schedule.reminder !== false && !schedule.completed && schedule.date && schedule.startTime)
      .map((schedule) => {
        const eventAt = new Date(`${schedule.date}T${schedule.startTime}`).getTime();
        return {
          key: `schedule-${schedule.id}`,
          kind: 'schedule',
          title: schedule.title,
          eventAt,
          dueAt: eventAt - scheduleLeadMinutes * 60_000,
          body: scheduleLeadMinutes > 0 ? `${schedule.title} starts in ${scheduleLeadMinutes} minutes.` : `It's time for: ${schedule.title}`,
          url: '/schedules',
        };
      }),
    ...(testReminder ? [testReminder] : []),
  ];
  // Keep recently due reminders queued through the dispatcher's five-minute polling window.
  const dispatchGrace = 24 * 60 * 60 * 1000;
  return items.filter((item) => Number.isFinite(item.dueAt) && item.dueAt > Date.now() - dispatchGrace);
};

const sendSync = async ({ subscription, enabled = true }) => {
  const { deviceId, deviceToken } = getDeviceCredentials();
  const response = await fetch('/api/push/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceToken, subscription, enabled, items: enabled ? getReminderItems() : [] }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Push service is unavailable.');
  return result;
};

export const enablePushReminders = async () => {
  const keyResponse = await fetch('/api/push/key');
  const keyResult = await keyResponse.json().catch(() => ({}));
  if (!keyResponse.ok || !keyResult.publicKey) throw new Error(keyResult.error || 'Push service is not configured.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('This browser does not support background push notifications.');

  const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('/sw.js');
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey),
    });
  }
  await sendSync({ subscription: subscription.toJSON() });
  localStorage.setItem(PUSH_ENABLED_KEY, 'true');
  return true;
};

export const syncPushReminders = async () => {
  if (localStorage.getItem(PUSH_ENABLED_KEY) !== 'true') return false;
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) throw new Error('This device no longer has a push subscription.');
  await sendSync({ subscription: subscription.toJSON() });
  return true;
};

export const queuePushTestReminder = async () => {
  if (localStorage.getItem(PUSH_ENABLED_KEY) !== 'true') throw new Error('Background push is not active on this device.');
  const testReminder = {
    key: `test-${crypto.randomUUID()}`,
    title: 'Test notification',
    dueAt: Date.now() + 30_000,
    url: '/settings',
  };
  localStorage.setItem('todoPushTestReminder', JSON.stringify(testReminder));
  await syncPushReminders();
  return testReminder;
};

export const disablePushReminders = async () => {
  if (localStorage.getItem(PUSH_ENABLED_KEY) === 'true') await sendSync({ enabled: false });
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  await subscription?.unsubscribe();
  localStorage.removeItem('todoPushTestReminder');
  localStorage.removeItem(PUSH_ENABLED_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_TOKEN_KEY);
};

export const pushRemindersEnabled = () => localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
