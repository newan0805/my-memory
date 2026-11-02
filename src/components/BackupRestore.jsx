import React, { useState, useEffect, useMemo } from 'react';
import { Stack, Group, Text, Button, FileButton, Modal, Alert, Badge, List, SegmentedControl } from '@mantine/core';
import { IconDownload, IconUpload, IconShieldCheck, IconShieldExclamation, IconAlertTriangle, IconArrowBackUp, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import {
  exportBackup, readBackupFile, planImport, applyImport, getUndoInfo, undoImport,
  getLastBackupAt, isStoragePersisted, requestPersistentStorage,
} from '../utils/storage';

const timeAgo = (ts) => {
  if (!ts) return 'Never';
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const LABELS = { todos: 'todos', schedules: 'schedules', subtasks: 'subtasks' };
const plural = (n, word) => `${n} ${n === 1 ? word.replace(/s$/, '') : word}`;

function ImportPreview({ plan }) {
  const { stats, mode } = plan;
  const keys = Object.keys(LABELS);
  const added = keys.filter((k) => stats.added[k]).map((k) => plural(stats.added[k], LABELS[k]));
  const conflicts = keys.reduce((n, k) => n + (stats.conflicts[k] || 0), 0);
  const unchanged = keys.reduce((n, k) => n + (stats.unchanged[k] || 0), 0);

  return (
    <List size="sm" spacing={4}>
      <List.Item>{mode === 'replace' ? 'Will contain: ' : 'Will add: '}<b>{added.length ? added.join(', ') : 'nothing new'}</b></List.Item>
      {mode === 'merge' && unchanged > 0 && <List.Item>{plural(unchanged, 'items')} already on this device (skipped)</List.Item>}
      {mode === 'merge' && conflicts > 0 && <List.Item>{plural(conflicts, 'items')} changed in both places — keeping this device's version</List.Item>}
      {stats.renumbered > 0 && <List.Item>{plural(stats.renumbered, 'items')} given a new ID to avoid clashing with existing ones</List.Item>}
      {stats.skipped > 0 && <List.Item c="orange">{plural(stats.skipped, 'invalid or orphaned entries')} skipped</List.Item>}
    </List>
  );
}

// compact: import-only variant for the onboarding screen (restoring after a reinstall).
function BackupRestore({ compact = false }) {
  const [lastBackup, setLastBackup] = useState(getLastBackupAt);
  const [persisted, setPersisted] = useState(null);
  const [pending, setPending] = useState(null);
  const [mode, setMode] = useState('merge');
  const [undoInfo, setUndoInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (compact) return;
    isStoragePersisted().then(setPersisted);
    getUndoInfo().then(setUndoInfo);
  }, [compact]);

  const plan = useMemo(() => (pending ? planImport(pending.backup, mode) : null), [pending, mode]);

  const handleExport = async () => {
    setBusy(true);
    try {
      const result = await exportBackup();
      if (result !== 'cancelled') {
        setLastBackup(getLastBackupAt());
        toast.success(result === 'shared' ? 'Backup shared — save it somewhere safe' : 'Backup downloaded');
      }
    } catch {
      toast.error('Could not export your data');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    try {
      setMode('merge');
      setPending(await readBackupFile(file));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reloadApp = () => window.location.assign(window.location.pathname === '/onboarding' ? '/' : window.location.pathname);

  const handleImport = async () => {
    setBusy(true);
    try {
      await applyImport(plan);
      toast.success('Backup imported');
      // Full reload so every page picks up the new data.
      setTimeout(reloadApp, 600);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const handleUndo = async () => {
    if (!confirm('Undo the last import? Your data goes back to exactly how it was before importing.')) return;
    try {
      await undoImport();
      toast.success('Import undone');
      setTimeout(reloadApp, 600);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePersist = async () => {
    const granted = await requestPersistentStorage();
    setPersisted(granted);
    toast[granted ? 'success' : 'info'](granted ? 'Storage is now protected' : 'Your browser decides this automatically — installing the app and using it often helps.');
  };

  const importButton = (
    <FileButton onChange={handleFile} accept="application/json,.json">
      {(props) => (
        <Button {...props} variant={compact ? 'subtle' : 'light'} leftSection={<IconUpload size={16} />} fullWidth={!compact}>
          {compact ? 'Restore from a backup file' : 'Import backup'}
        </Button>
      )}
    </FileButton>
  );

  return (
    <>
      {compact ? importButton : (
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="sm">Last backup: <Text span fw={600} c={lastBackup && Date.now() - lastBackup < 7 * 864e5 ? 'green' : 'orange'}>{timeAgo(lastBackup)}</Text></Text>
            {persisted !== null && (
              <Badge
                variant="light"
                color={persisted ? 'green' : 'orange'}
                leftSection={persisted ? <IconShieldCheck size={12} /> : <IconShieldExclamation size={12} />}
                style={{ cursor: persisted ? 'default' : 'pointer' }}
                onClick={persisted ? undefined : handlePersist}
              >
                {persisted ? 'Storage protected' : 'Storage not protected'}
              </Badge>
            )}
          </Group>

          <Group grow wrap="wrap" gap="sm" style={{ rowGap: 8 }}>
            <Button leftSection={<IconDownload size={16} />} onClick={handleExport} loading={busy} style={{ minWidth: 160 }}>
              Export backup
            </Button>
            <div style={{ minWidth: 160 }}>{importButton}</div>
          </Group>

          {undoInfo && (
            <Button variant="subtle" color="gray" size="xs" leftSection={<IconArrowBackUp size={14} />} onClick={handleUndo} style={{ alignSelf: 'flex-start' }}>
              Undo last import ({new Date(undoInfo.savedAt).toLocaleString()})
            </Button>
          )}

          <Text size="xs" c="dimmed">
            Your data is stored only on this device. Uninstalling the app (or iOS clearing storage after ~7 days unused)
            erases it — export a backup regularly and keep the file in Files, Drive or email.
          </Text>
        </Stack>
      )}

      <Modal opened={!!pending} onClose={() => setPending(null)} title="Import backup" centered>
        {pending && plan && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Backup of <b>{pending.summary.name}</b> from {new Date(pending.summary.exportedAt).toLocaleString()} —{' '}
              {pending.summary.todos} todos · {pending.summary.schedules} schedules · {pending.summary.subtasks} subtasks
            </Text>

            {!compact && (
              <SegmentedControl
                fullWidth
                value={mode}
                onChange={setMode}
                data={[{ value: 'merge', label: 'Merge (recommended)' }, { value: 'replace', label: 'Replace everything' }]}
              />
            )}

            <ImportPreview plan={plan} />

            {mode === 'merge' ? (
              <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
                Nothing on this device is removed. Items already here are kept as they are; only new ones are added.
              </Alert>
            ) : (
              <Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
                Everything currently in the app is replaced by the file. You can undo this afterwards from Settings.
              </Alert>
            )}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setPending(null)}>Cancel</Button>
              <Button color={mode === 'replace' ? 'orange' : 'blue'} onClick={handleImport} loading={busy}>
                {mode === 'replace' ? 'Replace' : 'Merge'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default BackupRestore;
