import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { ToastContainer } from 'react-toastify';
import App from './App';
import { restoreFromSnapshot, requestPersistentStorage, startAutoSnapshot } from './utils/storage';
import { registerServiceWorker } from './utils/serviceWorker';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/responsive.css';
import './styles/glass.css';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
  headings: {
    sizes: {
      h1: { fontSize: 'clamp(1.5rem, 1.1rem + 2vw, 2.125rem)' },
      h2: { fontSize: 'clamp(1.25rem, 1rem + 1.2vw, 1.625rem)' },
      h3: { fontSize: 'clamp(1.1rem, 0.95rem + 0.8vw, 1.375rem)' },
    },
  },
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#8C8FA3',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
});

function Toasts() {
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  return <ToastContainer position={isMobile ? 'top-center' : 'top-right'} theme="dark" newestOnTop limit={3} />;
}

const start = async () => {
  // Bring back data from the IndexedDB mirror if localStorage was wiped, before anything reads it.
  const restored = await restoreFromSnapshot();
  requestPersistentStorage();
  startAutoSnapshot();

  ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications />
        <App restored={restored} />
        <Toasts />
      </MantineProvider>
    </React.StrictMode>
  );

  // Only in production builds: a cached SW in dev serves stale pages over Vite's HMR.
  if (import.meta.env.PROD) registerServiceWorker();
};

start();
