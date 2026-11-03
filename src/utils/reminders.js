import { pushRemindersEnabled, syncPushReminders } from './pushNotifications';
import { getLocalDateStr } from './date';

const timers = new Map();

export const notificationsEnabled = () => localStorage.getItem('todoRemindersEnabled') === 'true';

const readPreferences = () => {
  try { return JSON.parse(localStorage.getItem('preferences') || '{}'); } catch { return {}; }
};

const showNotification = async (registration, title, body, tag, url) => {
  const options = { body, icon: '/icon-192.png', tag, data: { url } };
  if (registration) await registration.showNotification(title, options);
  else new Notification(title, options);
};

const scheduleDailyBriefing = (registration, time) => {
  const [hours, minutes] = (time || '07:00').split(':').map(Number);
  const next = new Date();
  next.setHours(hours || 0, minutes || 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);

  const notify = async () => {
    const today = getLocalDateStr();
    let todos = [];
    let schedules = [];
    try { todos = JSON.parse(localStorage.getItem('todos') || '[]'); } catch { /* ignore damaged todo data */ }
    try { schedules = JSON.parse(localStorage.getItem('schedules') || '[]'); } catch { /* ignore damaged schedule data */ }
    const agenda = [
      ...schedules.filter((item) => item.date === today && !item.completed).map((item) => ({ time: item.startTime || '—', title: item.title })),
      ...todos.filter((item) => item.dueDate === today && !item.completed).map((item) => ({ time: item.dueTime || 'Any time', title: item.title })),
    ].sort((a, b) => a.time.localeCompare(b.time));
    const lines = agenda.slice(0, 4).map((item) => `${item.time} — ${item.title}`);
    if (agenda.length > lines.length) lines.push(`and ${agenda.length - lines.length} more`);
    const body = lines.length ? lines.join('\n') : 'Nothing scheduled today. Enjoy the open time.';
    try { await showNotification(registration, "Today's agenda", body, `daily-agenda-${today}`, '/'); }
    catch (error) { console.error('Could not show the daily agenda notification:', error); }
    scheduleDailyBriefing(registration, time);
  };

  const delay = Math.min(next.getTime() - Date.now(), 2_147_000_000);
  timers.set('daily-briefing', setTimeout(notify, delay));
};

export const scheduleReminders = async () => {
  timers.forEach(clearTimeout);
  timers.clear();
  if (!notificationsEnabled() || !('Notification' in window) || Notification.permission !== 'granted') return;
  const preferences = readPreferences();
  const registration = await navigator.serviceWorker?.getRegistration();
  if (preferences.dailyBriefingEnabled) scheduleDailyBriefing(registration, preferences.dailyBriefingTime);
  if (pushRemindersEnabled()) {
    try { await syncPushReminders(); } catch (error) { console.error('Could not sync background reminders:', error); }
    return;
  }

  let todos = [];
  try { todos = JSON.parse(localStorage.getItem('todos') || '[]'); } catch { return; }
  let schedules = [];
  try { schedules = JSON.parse(localStorage.getItem('schedules') || '[]'); } catch { /* ignore damaged data */ }
  const storedLeadMinutes = preferences.scheduleReminderLeadMinutes;
  const scheduleLeadMinutes = Math.max(0, Math.min(1440, storedLeadMinutes == null ? 30 : Number(storedLeadMinutes) || 0));
  const items = [
    ...todos.filter((todo) => todo.reminder !== false && !todo.completed && todo.dueDate && todo.dueTime)
      .map((todo) => ({ key: `todo-${todo.id}`, kind: 'todo', id: todo.id, title: todo.title, date: todo.dueDate, time: todo.dueTime })),
    ...schedules.filter((schedule) => schedule.reminder !== false && !schedule.completed && schedule.date && schedule.startTime)
      .map((schedule) => ({ key: `schedule-${schedule.id}`, kind: 'schedule', id: schedule.id, title: schedule.title, date: schedule.date, time: schedule.startTime })),
  ];
  items.forEach((item) => {
    const eventAt = new Date(`${item.date}T${item.time}`).getTime();
    const dueAt = eventAt - (item.kind === 'schedule' ? scheduleLeadMinutes * 60_000 : 0);
    const notifyWhenDue = async () => {
      const remaining = dueAt - Date.now();
      if (remaining > 0) {
        timers.set(item.key, setTimeout(notifyWhenDue, Math.min(remaining, 2_147_000_000)));
        return;
      }
      const list = JSON.parse(localStorage.getItem(item.kind === 'todo' ? 'todos' : 'schedules') || '[]');
      const latest = list.find((entry) => entry.id === item.id);
      if (!latest || latest.completed) return;
      const minutesUntilStart = Math.max(0, Math.ceil((eventAt - Date.now()) / 60_000));
      const body = item.kind === 'schedule' && scheduleLeadMinutes > 0 && minutesUntilStart > 0
        ? `${item.title} starts in ${minutesUntilStart} minutes.`
        : `It's time for: ${item.title}`;
      await showNotification(registration, 'My Memory reminder', body, item.key, item.kind === 'todo' ? '/todos' : '/schedules');
      timers.delete(item.key);
    };
    if (dueAt > Date.now()) {
      timers.set(item.key, setTimeout(notifyWhenDue, Math.min(dueAt - Date.now(), 2_147_000_000)));
    } else if (item.kind === 'schedule' && eventAt > Date.now()) {
      timers.set(item.key, setTimeout(notifyWhenDue, 0));
    }
  });
};

export const refreshTodoReminders = () => window.dispatchEvent(new Event('todo-reminders-changed'));
