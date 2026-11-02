import React, { useState } from 'react';
import { Modal, Stack, Text, Button, Group, Radio } from '@mantine/core';
import { toast } from 'react-toastify';
import { createSchedules, deleteSchedules, updateSchedules, idsInScope, seriesSize } from '../utils/recurrence';
import { refreshTodoReminders } from '../utils/reminders';

export const SCOPE_OPTIONS = [
  { value: 'one', label: 'This event only' },
  { value: 'following', label: 'This and following events' },
  { value: 'all', label: 'All events in the series' },
];

// Shared add / edit / delete for schedules, including recurring series.
// Pages keep their own state; this keeps localStorage and both lists in sync.
function useScheduleActions({ schedules, subtasks, setSchedules, setSubtasks }) {
  const [toDelete, setToDelete] = useState(null);
  const [scope, setScope] = useState('one');

  const add = ({ base, rule, drafts }) => {
    if (!base.title?.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    const result = createSchedules({ schedules, subtasks, base, rule, drafts });
    if (result.count === 0) {
      toast.error('No dates match the repeat settings');
      return false;
    }
    setSchedules(result.schedules);
    refreshTodoReminders();
    setSubtasks(result.subtasks);
    toast.success(result.count > 1 ? `${result.count} schedules added` : 'Schedule added!');
    return true;
  };

  const save = (edited, editScope = 'one') => {
    if (!edited?.title?.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    const original = schedules.find((s) => s.id === edited.id) || edited;
    const count = idsInScope(schedules, original, editScope).length;
    setSchedules(updateSchedules({ schedules, edited, scope: editScope }));
    refreshTodoReminders();
    toast.success(count > 1 ? `${count} schedules updated` : 'Schedule updated!');
    return true;
  };

  const remove = (schedule, removeScope = 'one') => {
    const ids = idsInScope(schedules, schedule, removeScope);
    const result = deleteSchedules({ schedules, subtasks, ids });
    setSchedules(result.schedules);
    refreshTodoReminders();
    setSubtasks(result.subtasks);
    toast.success(ids.length > 1 ? `${ids.length} schedules deleted` : 'Schedule deleted');
  };

  // Single schedules delete straight away; occurrences of a series ask which ones.
  const requestDelete = (scheduleOrId) => {
    const schedule = typeof scheduleOrId === 'object' ? scheduleOrId : schedules.find((s) => s.id === scheduleOrId);
    if (!schedule) return;
    if (!schedule.seriesId || seriesSize(schedules, schedule) <= 1) {
      remove(schedule);
      return;
    }
    setScope('one');
    setToDelete(schedule);
  };

  const deleteDialog = (
    <Modal opened={!!toDelete} onClose={() => setToDelete(null)} title="Delete recurring schedule" centered size="sm">
      {toDelete && (
        <Stack gap="md">
          <Text size="sm">“{toDelete.title}” on {toDelete.date} is part of a series of {seriesSize(schedules, toDelete)}.</Text>
          <Radio.Group value={scope} onChange={setScope}>
            <Stack gap="xs">
              {SCOPE_OPTIONS.map((o) => <Radio key={o.value} value={o.value} label={o.label} />)}
            </Stack>
          </Radio.Group>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button color="red" onClick={() => { remove(toDelete, scope); setToDelete(null); }}>Delete</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );

  return { add, save, requestDelete, deleteDialog };
}

export default useScheduleActions;
