import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Card, Group, Stack, Button, Badge, Checkbox, Paper, ActionIcon, Modal, TextInput, Select, Switch } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconChecklist, IconClock } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { getLocalDateStr } from '../utils/date';
import DateFilter, { useDateFilter, getDateRange, isInRange, sortByDate } from '../components/DateFilter';
import { refreshTodoReminders } from '../utils/reminders';

const PRIORITY_COLORS = { high: '#f87171', medium: '#facc15', low: '#60a5fa' };

const formatDue = (dateStr, today) => {
  if (!dateStr) return '';
  if (dateStr === today) return 'Today';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

function TodoCard({ todo, today, onToggle, onDelete }) {
  const overdue = !todo.completed && todo.dueDate && todo.dueDate < today;
  return (
    <Paper
      p="sm"
      className={`glass-card${todo.completed ? ' is-done' : ''}`}
      style={{ '--accent': overdue ? '#ef4444' : PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium }}
    >
      <Group wrap="nowrap" gap="sm" align="center">
        <Checkbox radius="xl" size="md" checked={!!todo.completed} onChange={() => onToggle(todo.id)} aria-label={`Mark "${todo.title}" ${todo.completed ? 'not done' : 'done'}`} />
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={500} lineClamp={2} td={todo.completed ? 'line-through' : undefined} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
          <Group gap={8} wrap="wrap">
            <Group gap={4} wrap="nowrap">
              <IconClock size={13} color={overdue ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-dimmed)'} />
              <Text size="xs" c={overdue ? 'red.4' : 'dimmed'}>{formatDue(todo.dueDate, today)}{todo.dueTime ? ` · ${todo.dueTime}` : ''}</Text>
            </Group>
            {overdue && <Badge size="xs" color="red" variant="filled">Overdue</Badge>}
            {todo.category && <Badge size="xs" variant="light" color="gray">{todo.category}</Badge>}
          </Group>
        </Stack>
        <ActionIcon color="red" variant="subtle" onClick={() => onDelete(todo.id)} aria-label="Delete todo"><IconTrash size={16} /></ActionIcon>
      </Group>
    </Paper>
  );
}

function TodosPage({ user }) {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal', dueDate: getLocalDateStr(), reminder: true });

  useEffect(() => {
    setTodos(JSON.parse(localStorage.getItem('todos') || '[]'));
  }, []);

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    toast.success(updated.find(t => t.id === id).completed ? 'Task completed!' : 'Task reopened');
  };

  const deleteTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    toast.success('Task deleted');
  };

  const addTodo = () => {
    if (!newTodo.title) return toast.error('Please enter a title');
    const todo = { id: Date.now(), ...newTodo, completed: false };
    const updated = [...todos, todo];
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    setModalOpen(false);
    setNewTodo({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal', dueDate: getLocalDateStr(), reminder: true });
    toast.success('Todo added!');
  };

  const [filter, setFilter] = useDateFilter('todos');
  const range = getDateRange(filter);
  const today = getLocalDateStr();
  // "Today" also keeps unfinished overdue tasks visible so they aren't forgotten.
  const visibleTodos = sortByDate(
    todos.filter(t => isInRange(t.dueDate, range) || (filter.preset === 'today' && !t.completed && t.dueDate && t.dueDate < today)),
    filter.sort, t => t.dueDate, t => t.dueTime
  );
  const highTodos = visibleTodos.filter(t => t.priority === 'high');
  const mediumTodos = visibleTodos.filter(t => t.priority === 'medium');
  const lowTodos = visibleTodos.filter(t => t.priority === 'low');

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}><IconChecklist size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />Todos</Title>
            <Text c="dimmed">Manage all your tasks</Text>
          </Stack>
          <Group>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>Add Todo</Button>
            <Button variant="subtle" visibleFrom="sm" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back</Button>
          </Group>
        </Group>

        <DateFilter value={filter} onChange={setFilter} />

        <Card withBorder padding="lg" radius="lg" className="glass-panel">
          <Stack gap="lg">
            {[
              { key: 'high', label: '🔥 High Priority', items: highTodos },
              { key: 'medium', label: '⚡ Medium Priority', items: mediumTodos },
              { key: 'low', label: '🌿 Low Priority', items: lowTodos },
            ].filter((g) => g.items.length > 0).map((group) => (
              <Stack gap="xs" key={group.key}>
                <Group gap="xs">
                  <Text fw={600}>{group.label}</Text>
                  <Badge size="sm" variant="light" color="gray">{group.items.filter((t) => !t.completed).length}/{group.items.length} left</Badge>
                </Group>
                {group.items.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} today={today} onToggle={toggleTodo} onDelete={deleteTodo} />
                ))}
              </Stack>
            ))}
            {visibleTodos.length === 0 && (
              <Stack align="center" py="xl">
                <Text c="dimmed">{todos.length === 0 ? 'No todos yet. Add your first todo!' : 'No todos for this date range.'}</Text>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>Add Todo</Button>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add New Todo" centered>
        <Stack gap="md">
          <TextInput label="Title" required value={newTodo.title} onChange={(e) => setNewTodo({...newTodo, title: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newTodo.priority} onChange={(v) => setNewTodo({...newTodo, priority: v})} />
          <TextInput label="Due Date" type="date" value={newTodo.dueDate} onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})} />
          <TextInput label="Due Time" type="time" value={newTodo.dueTime} onChange={(e) => setNewTodo({...newTodo, dueTime: e.target.value})} />
          <Switch label="Remind me at the due time" checked={newTodo.reminder} onChange={(e) => setNewTodo({...newTodo, reminder: e.currentTarget.checked})} />
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Study',label:'Study'},{value:'School',label:'School'},{value:'Fitness',label:'Fitness'}]} value={newTodo.category} onChange={(v) => setNewTodo({...newTodo, category: v})} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={addTodo}>Add Todo</Button>
          </Group>
        </Stack>
      </Modal>
    </Layout>
  );
}

export default TodosPage;
