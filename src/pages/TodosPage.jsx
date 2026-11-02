import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Card, Group, Stack, Button, Badge, Checkbox, Paper, ActionIcon, Modal, TextInput, Select } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconChecklist } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { getLocalDateStr } from '../utils/date';
import DateFilter, { useDateFilter, getDateRange, isInRange, sortByDate } from '../components/DateFilter';

function TodosPage({ user }) {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal', dueDate: getLocalDateStr() });

  useEffect(() => {
    setTodos(JSON.parse(localStorage.getItem('todos') || '[]'));
  }, []);

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    toast.success(updated.find(t => t.id === id).completed ? 'Task completed!' : 'Task reopened');
  };

  const deleteTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    toast.success('Task deleted');
  };

  const addTodo = () => {
    if (!newTodo.title) return toast.error('Please enter a title');
    const todo = { id: Date.now(), ...newTodo, completed: false };
    const updated = [...todos, todo];
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    setModalOpen(false);
    setNewTodo({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal', dueDate: getLocalDateStr() });
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

        <Card withBorder padding="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
          <Stack gap="lg">
            {highTodos.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="lg">🔥 High Priority ({highTodos.length})</Text>
                {highTodos.map(todo => (
                  <Paper key={todo.id} p="md" withBorder style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                    <Group align="flex-start" wrap="nowrap">
                      <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Text fw={500} style={{ flex: 1, minWidth: 0 }} td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                          <ActionIcon color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={16} /></ActionIcon>
                        </Group>
                        <Group gap="xs">
                          <Badge color="red">High</Badge>
                          <Text size="sm" c={!todo.completed && todo.dueDate < today ? 'red' : 'dimmed'}>Due: {todo.dueDate} {todo.dueTime}</Text>
                          <Text size="sm" c="dimmed">{todo.category}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
            {mediumTodos.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="lg">⚡ Medium Priority ({mediumTodos.length})</Text>
                {mediumTodos.map(todo => (
                  <Paper key={todo.id} p="md" withBorder>
                    <Group align="flex-start" wrap="nowrap">
                      <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Text fw={500} style={{ flex: 1, minWidth: 0 }} td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                          <ActionIcon color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={16} /></ActionIcon>
                        </Group>
                        <Group gap="xs">
                          <Badge color="yellow">Medium</Badge>
                          <Text size="sm" c={!todo.completed && todo.dueDate < today ? 'red' : 'dimmed'}>Due: {todo.dueDate} {todo.dueTime}</Text>
                          <Text size="sm" c="dimmed">{todo.category}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
            {lowTodos.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="lg">📝 Low Priority ({lowTodos.length})</Text>
                {lowTodos.map(todo => (
                  <Paper key={todo.id} p="md" withBorder>
                    <Group align="flex-start" wrap="nowrap">
                      <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Text fw={500} style={{ flex: 1, minWidth: 0 }} td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                          <ActionIcon color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={16} /></ActionIcon>
                        </Group>
                        <Group gap="xs">
                          <Badge color="blue">Low</Badge>
                          <Text size="sm" c={!todo.completed && todo.dueDate < today ? 'red' : 'dimmed'}>Due: {todo.dueDate} {todo.dueTime}</Text>
                          <Text size="sm" c="dimmed">{todo.category}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
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
