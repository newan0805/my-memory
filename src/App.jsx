import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import TodosPage from './pages/TodosPage';
import SchedulesPage from './pages/SchedulesPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('userProfile');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={<Onboarding onComplete={setUser} />} />
        <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/calendar" element={user ? <Calendar user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/todos" element={user ? <TodosPage user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/schedules" element={user ? <SchedulesPage user={user} /> : <Navigate to="/onboarding" />} />
        <Route path="/settings" element={user ? <Settings user={user} setUser={setUser} /> : <Navigate to="/onboarding" />} />
        <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/onboarding" />} />
      </Routes>
    </Router>
  );
}

export default App;
