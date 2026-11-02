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
  const items = [
    ...todos.filter((todo) => todo.reminder !== false && !todo.completed && todo.dueDate && todo.dueTime)
      .map((todo) => ({ key: `todo-${todo.id}`, title: todo.title, dueAt: new Date(`${todo.dueDate}T${todo.dueTime}`).getTime(), url: '/todos' })),
    ...schedules.filter((schedule) => schedule.reminder !== false && !schedule.completed && schedule.date && schedule.startTime)
      .map((schedule) => ({ key: `schedule-${schedule.id}`, title: schedule.title, dueAt: new Date(`${schedule.date}T${schedule.startTime}`).getTime(), url: '/schedules' })),
  ];
  return items.filter((item) => Number.isFinite(item.dueAt) && item.dueAt > Date.now());
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

export const disablePushReminders = async () => {
  if (localStorage.getItem(PUSH_ENABLED_KEY) === 'true') await sendSync({ enabled: false });
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  await subscription?.unsubscribe();
  localStorage.removeItem(PUSH_ENABLED_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_TOKEN_KEY);
};

export const pushRemindersEnabled = () => localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
