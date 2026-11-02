const timers = new Map();

export const notificationsEnabled = () => localStorage.getItem('todoRemindersEnabled') === 'true';

export const scheduleReminders = async () => {
  timers.forEach(clearTimeout);
  timers.clear();
  if (!notificationsEnabled() || !('Notification' in window) || Notification.permission !== 'granted') return;

  let todos = [];
  try { todos = JSON.parse(localStorage.getItem('todos') || '[]'); } catch { return; }
  let schedules = [];
  try { schedules = JSON.parse(localStorage.getItem('schedules') || '[]'); } catch { /* ignore damaged data */ }
  const registration = await navigator.serviceWorker?.getRegistration();
  const items = [
    ...todos.filter((todo) => todo.reminder !== false && !todo.completed && todo.dueDate && todo.dueTime)
      .map((todo) => ({ key: `todo-${todo.id}`, kind: 'todo', id: todo.id, title: todo.title, date: todo.dueDate, time: todo.dueTime })),
    ...schedules.filter((schedule) => schedule.reminder !== false && !schedule.completed && schedule.date && schedule.startTime)
      .map((schedule) => ({ key: `schedule-${schedule.id}`, kind: 'schedule', id: schedule.id, title: schedule.title, date: schedule.date, time: schedule.startTime })),
  ];
  items.forEach((item) => {
    const dueAt = new Date(`${item.date}T${item.time}`).getTime();
    const notifyWhenDue = async () => {
      const remaining = dueAt - Date.now();
      if (remaining > 0) {
        timers.set(item.key, setTimeout(notifyWhenDue, Math.min(remaining, 2_147_000_000)));
        return;
      }
      const list = JSON.parse(localStorage.getItem(item.kind === 'todo' ? 'todos' : 'schedules') || '[]');
      const latest = list.find((entry) => entry.id === item.id);
      if (!latest || latest.completed) return;
      const options = { body: `It's time for: ${item.title}`, icon: '/icon-192.png', tag: item.key, data: { url: item.kind === 'todo' ? '/todos' : '/schedules' } };
      if (registration) await registration.showNotification('My Memory reminder', options);
      else new Notification('My Memory reminder', options);
      timers.delete(item.key);
    };
    if (dueAt > Date.now()) timers.set(item.key, setTimeout(notifyWhenDue, Math.min(dueAt - Date.now(), 2_147_000_000)));
  });
};

export const refreshTodoReminders = () => window.dispatchEvent(new Event('todo-reminders-changed'));
