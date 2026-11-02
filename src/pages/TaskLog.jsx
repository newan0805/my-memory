import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Title, Text, Card, Group, Stack, Button, Badge, SegmentedControl, ThemeIcon } from '@mantine/core';
import { IconArrowLeft, IconList, IconCheck, IconChecklist, IconCalendar, IconSubtask } from '@tabler/icons-react';
import Layout from '../components/Layout';
import DateFilter, { useDateFilter, getDateRange, isInRange } from '../components/DateFilter';

const TYPE_META = {
  todo: { label: 'Todo', color: 'blue', icon: IconChecklist },
  schedule: { label: 'Schedule', color: 'orange', icon: IconCalendar },
  subtask: { label: 'Subtask', color: 'violet', icon: IconSubtask },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No date';
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

function TaskLog({ user }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('completed');
  const [data, setData] = useState({ todos: [], schedules: [], subtasks: [] });
  const [dateFilter, setDateFilter] = useDateFilter('tasklog', { preset: 'pastWeek', sort: 'desc' });

  useEffect(() => {
    setData({
      todos: JSON.parse(localStorage.getItem('todos') || '[]'),
      schedules: JSON.parse(localStorage.getItem('schedules') || '[]'),
      subtasks: JSON.parse(localStorage.getItem('subtasks') || '[]'),
    });
  }, []);

  const groups = useMemo(() => {
    const scheduleById = Object.fromEntries(data.schedules.map((s) => [s.id, s]));
    const entries = [
      ...data.todos.map((t) => ({ id: `todo-${t.id}`, type: 'todo', title: t.title, date: t.dueDate, time: t.dueTime, completed: t.completed, detail: t.category })),
      ...data.schedules.map((s) => ({ id: `schedule-${s.id}`, type: 'schedule', title: s.title, date: s.date, time: s.startTime, completed: s.completed, detail: s.category })),
      ...data.subtasks.map((st) => ({
        id: `subtask-${st.id}`,
        type: 'subtask',
        title: st.title,
        date: scheduleById[st.scheduleId]?.date || st.createdAt?.slice(0, 10),
        completed: st.completed,
        detail: scheduleById[st.scheduleId]?.title,
      })),
    ]
      .filter((e) => filter === 'all' || (filter === 'completed' ? e.completed : !e.completed))
      .filter((e) => isInRange(e.date, getDateRange(dateFilter)));

    const byDate = {};
    entries.forEach((e) => { (byDate[e.date || ''] ||= []).push(e); });
    return Object.entries(byDate)
      .sort(([a], [b]) => (dateFilter.sort === 'desc' ? b.localeCompare(a) : a.localeCompare(b)))
      .map(([date, items]) => [date, items.sort((a, b) => (a.time || '').localeCompare(b.time || ''))]);
  }, [data, filter, dateFilter]);

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}><IconList size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />Task Log</Title>
            <Text c="dimmed">A history of your todos, schedules and subtasks</Text>
          </Stack>
          <Button variant="subtle" visibleFrom="sm" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back</Button>
        </Group>

        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[{ value: 'completed', label: 'Completed' }, { value: 'pending', label: 'Pending' }, { value: 'all', label: 'All' }]}
          style={{ alignSelf: 'flex-start' }}
        />
        <DateFilter value={dateFilter} onChange={setDateFilter} presets={['today', 'pastWeek', 'date', 'all']} />

        {groups.length === 0 ? (
          <Card withBorder padding="xl" radius="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
            <Text c="dimmed" ta="center">Nothing here yet.</Text>
          </Card>
        ) : groups.map(([date, items]) => (
          <Card key={date} withBorder padding="lg" radius="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>{formatDate(date)}</Text>
              <Badge variant="light">{items.length}</Badge>
            </Group>
            <Stack gap="xs">
              {items.map((item) => {
                const meta = TYPE_META[item.type];
                return (
                  <Group key={item.id} justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
                      <ThemeIcon size="md" radius="xl" variant="light" color={item.completed ? 'green' : meta.color}>
                        {item.completed ? <IconCheck size={14} /> : <meta.icon size={14} />}
                      </ThemeIcon>
                      <Stack gap={0} style={{ overflow: 'hidden' }}>
                        <Text size="sm" fw={500} truncate td={item.completed ? 'line-through' : undefined}>{item.title}</Text>
                        {item.detail && <Text size="xs" c="dimmed" truncate>{item.detail}</Text>}
                      </Stack>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {item.time && <Text size="xs" c="dimmed">{item.time}</Text>}
                      <Badge size="sm" variant="light" color={meta.color}>{meta.label}</Badge>
                    </Group>
                  </Group>
                );
              })}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Layout>
  );
}

export default TaskLog;
