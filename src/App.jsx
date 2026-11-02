import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import TodosPage from './pages/TodosPage';
import SchedulesPage from './pages/SchedulesPage';
import TaskLog from './pages/TaskLog';
import { getLastBackupAt } from './utils/storage';
import { scheduleReminders } from './utils/reminders';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('userProfile') || 'null');
  } catch {
    return null;
  }
};

function App({ restored }) {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    scheduleReminders();
    const refresh = () => scheduleReminders();
    window.addEventListener('todo-reminders-changed', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('todo-reminders-changed', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    if (restored) toast.success('Your data was restored from the on-device backup.');
  }, [restored]);

  // Gentle weekly nudge to export a backup — the only protection against uninstalling the app.
  useEffect(() => {
    if (!user) return;
    const lastBackup = getLastBackupAt();
    const lastReminder = Number(localStorage.getItem('backupReminderAt')) || 0;
    const hasData = (localStorage.getItem('todos') || '[]') !== '[]' || (localStorage.getItem('schedules') || '[]') !== '[]';
    if (hasData && (!lastBackup || Date.now() - lastBackup > WEEK) && Date.now() - lastReminder > DAY) {
      localStorage.setItem('backupReminderAt', String(Date.now()));
      toast.info('Tip: export a backup in Settings → Backup & Restore so you never lose your data.', { autoClose: 8000 });
    }
  }, [user]);

  const guard = (element) => (user ? element : <Navigate to="/onboarding" replace />);

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={user ? <Navigate to="/" replace /> : <Onboarding onComplete={setUser} />} />
        <Route path="/" element={guard(<Dashboard user={user} />)} />
        <Route path="/calendar" element={guard(<Calendar user={user} />)} />
        <Route path="/todos" element={guard(<TodosPage user={user} />)} />
        <Route path="/schedules" element={guard(<SchedulesPage user={user} />)} />
        <Route path="/tasklog" element={guard(<TaskLog user={user} />)} />
        <Route path="/settings" element={guard(<Settings user={user} setUser={setUser} />)} />
        <Route path="/profile" element={guard(<Profile user={user} setUser={setUser} />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
