import React from 'react';
import { toast } from 'react-toastify';
import { Button, Group, Text } from '@mantine/core';
import { saveSnapshot } from './storage';

const UPDATE_TOAST_ID = 'app-update';

const promptUpdate = (worker) => {
  if (toast.isActive(UPDATE_TOAST_ID)) return;
  toast.info(
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text size="sm">A new version is ready.</Text>
      <Button
        size="xs"
        onClick={async () => {
          // Make sure the IndexedDB mirror is current before the page reloads.
          await saveSnapshot();
          worker.postMessage({ type: 'SKIP_WAITING' });
        }}
      >
        Update
      </Button>
    </Group>,
    { toastId: UPDATE_TOAST_ID, autoClose: false, closeOnClick: false }
  );
};

// Soft update flow: new SW installs in the background -> user taps Update -> SW activates -> page reloads.
// User data is never cleared by an update.
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const watch = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(worker);
        });
      };

      if (registration.waiting && navigator.serviceWorker.controller) promptUpdate(registration.waiting);
      watch(registration.installing);
      registration.addEventListener('updatefound', () => watch(registration.installing));

      // Installed PWAs can stay open for days: check for updates when they come back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    } catch {
      // Offline support is optional; the app works without it.
    }
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
};
