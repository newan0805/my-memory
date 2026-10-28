import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Group, 
  Stack, 
  Button, 
  Badge, 
  Progress, 
  Grid, 
  Checkbox,
  Divider,
  ThemeIcon,
  Timeline,
  Paper,
  SimpleGrid,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Textarea
} from '@mantine/core';
import { 
  IconCalendar, 
  IconCheckbox, 
  IconClock, 
  IconMapPin, 
  IconPlus, 
  IconAlertCircle,
  IconChevronRight,
  IconTrash,
  IconSun,
  IconTarget,
  IconEdit
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [todos, setTodos] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });
  const [newTodo, setNewTodo] = useState({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal' });
  const [newSchedule, setNewSchedule] = useState({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', description: '' });

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setNow(new Date());
      loadData();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = () => {
    setSchedules(JSON.parse(localStorage.getItem('schedules') || '[]'));
    setTodos(JSON.parse(localStorage.getItem('todos') || '[]'));
    setSubtasks(JSON.parse(localStorage.getItem('subtasks') || '[]'));
  };

  const toLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayStr = () => toLocalDateStr(now);
  const getTomorrowStr = () => {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return toLocalDateStr(t);
  };
  const getYesterdayStr = () => {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return toLocalDateStr(y);
  };

  const todaySchedules = schedules.filter(s => s.date === getTodayStr()).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const todayTodos = todos.filter(t => t.dueDate === getTodayStr());
  const overdueTodos = todos.filter(t => t.dueDate < getTodayStr() && !t.completed);
  const tomorrowSchedules = schedules.filter(s => s.date === getTomorrowStr()).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const tomorrowTodos = todos.filter(t => t.dueDate === getTomorrowStr());

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const currentSchedule = todaySchedules.find(s => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return currentMins >= start && currentMins < end;
  });
  const nextSchedule = todaySchedules.find(s => timeToMinutes(s.startTime) > currentMins);

  const totalTodos = todayTodos.length;
  const completedTodos = todayTodos.filter(t => t.completed).length;
  const totalSchedules = todaySchedules.length;
  const completedSchedules = todaySchedules.filter(s => s.completed).length;
  const overall = totalTodos + totalSchedules === 0 ? 0 : Math.round(((completedTodos + completedSchedules) / (totalTodos + totalSchedules)) * 100);

  const scheduledMins = todaySchedules.reduce((t, s) => t + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)), 0);
  const completedScheduledMins = todaySchedules.filter(s => s.completed).reduce((t, s) => t + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)), 0);
  const freeMins = 24 * 60 - scheduledMins;

  let countdown = '';
  if (nextSchedule) {
    const diff = timeToMinutes(nextSchedule.startTime) - currentMins;
    if (diff > 0) {
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }

  const highTodos = todayTodos.filter(t => t.priority === 'high');
  const mediumTodos = todayTodos.filter(t => t.priority === 'medium');
  const lowTodos = todayTodos.filter(t => t.priority === 'low');

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

  const deleteSchedule = (id) => {
    const updated = schedules.filter(s => s.id !== id);
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    toast.success('Schedule deleted');
  };

  const completeAllOverdue = () => {
    const updated = todos.map(t => t.dueDate < getTodayStr() && !t.completed ? { ...t, completed: true } : t);
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    toast.success('All overdue tasks completed');
  };

  const addTodo = () => {
    if (!newTodo.title) return toast.error('Please enter a title');
    const todo = { id: Date.now(), title: newTodo.title, priority: newTodo.priority, dueTime: newTodo.dueTime, category: newTodo.category, dueDate: getTodayStr(), completed: false };
    const updated = [...todos, todo];
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    setTodoModalOpen(false);
    setNewTodo({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal' });
    toast.success('Todo added!');
  };

  const addSchedule = () => {
    if (!newSchedule.title) return toast.error('Please enter a title');
    const schedule = { id: Date.now(), ...newSchedule, date: getTodayStr(), completed: false };
    const updated = [...schedules, schedule];
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    setScheduleModalOpen(false);
    setNewSchedule({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', description: '' });
    toast.success('Schedule added!');
  };

  const openDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailModalOpen(true);
  };

  const getSubtasksForSchedule = (scheduleId) => subtasks.filter(st => st.scheduleId === scheduleId);
  
  const addSubtask = () => {
    if (!newSubtask.title) return toast.error('Please enter title');
    const subtask = { id: Date.now(), scheduleId: selectedSchedule.id, title: newSubtask.title, description: newSubtask.description, completed: false };
    const updated = [...subtasks, subtask];
    localStorage.setItem('subtasks', JSON.stringify(updated));
    setSubtasks(updated);
    setNewSubtask({ title: '', description: '' });
    toast.success('Subtask added!');
  };

  const toggleSubtask = (id) => {
    const updated = subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
    localStorage.setItem('subtasks', JSON.stringify(updated));
    setSubtasks(updated);
  };

  const deleteSubtask = (id) => {
    const updated = subtasks.filter(st => st.id !== id);
    localStorage.setItem('subtasks', JSON.stringify(updated));
    setSubtasks(updated);
  };

  const getScheduleProgress = (scheduleId) => {
    const sts = getSubtasksForSchedule(scheduleId);
    if (sts.length === 0) return 0;
    const done = sts.filter(st => st.completed).length;
    return Math.round((done / sts.length) * 100);
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={1}>{greeting}, {user.firstName} <IconSun size={32} style={{ verticalAlign: 'middle', color: '#f59e0b' }} /></Title>
            <Text c="dimmed">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text c="dimmed" size="sm">Day of week: {now.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
          </Stack>
          <Stack gap={4} align="flex-end">
            <Title order={1} style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Title>
            <Text c="dimmed" size="sm">Current time</Text>
          </Stack>
        </Group>

        <Group gap="sm">
          <Button leftSection={<IconCalendar size={16} />}>Today</Button>
          <Button variant="gradient" gradient={{ from: 'blue', to: 'violet' }} leftSection={<IconPlus size={16} />} onClick={() => setTodoModalOpen(true)}>Quick Add Todo</Button>
          <Button variant="gradient" gradient={{ from: 'violet', to: 'purple' }} leftSection={<IconPlus size={16} />} onClick={() => setScheduleModalOpen(true)}>Add Schedule</Button>
        </Group>

        {overdueTodos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card withBorder padding="md" style={{ borderColor: 'rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(10px)' }}>
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light"><IconAlertCircle size={16} /></ThemeIcon>
                  <Text fw={600} c="red">{overdueTodos.length} overdue task{overdueTodos.length === 1 ? '' : 's'}</Text>
                </Group>
                <Button size="xs" variant="light" color="red" onClick={completeAllOverdue}>Complete all</Button>
              </Group>
              <Stack gap="xs">
                {overdueTodos.map(todo => (
                  <Paper key={todo.id} p="sm" withBorder style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
                        <Stack gap={2}>
                          <Text fw={500} td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                          <Text size="sm" c="red">Due: {todo.dueDate === getYesterdayStr() ? 'Yesterday' : todo.dueDate}, {todo.dueTime}</Text>
                        </Stack>
                      </Group>
                      <ActionIcon color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </motion.div>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.4)' }} component={motion.div} whileHover={{ scale: 1.02, y: -4 }}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Today's Schedules</Text>
              <Title order={2}>{todaySchedules.length}</Title>
              <Text size="xs" c="dimmed">scheduled items today</Text>
            </Stack>
          </Card>
          <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.4)' }} component={motion.div} whileHover={{ scale: 1.02, y: -4 }}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Today's Todos</Text>
              <Title order={2}>{todayTodos.length}</Title>
              <Text size="xs" c="dimmed">{completedTodos} completed · {totalTodos - completedTodos} remaining</Text>
            </Stack>
          </Card>
          <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.4)' }} component={motion.div} whileHover={{ scale: 1.02, y: -4 }}>
            <Stack gap={8}>
              <Text size="sm" c="dimmed">Overall Progress</Text>
              <Title order={2}>{overall}%</Title>
              <Progress value={overall} size="sm" color={overall >= 70 ? 'green' : overall >= 40 ? 'yellow' : 'red'} />
              <Text size="xs" c="dimmed">{completedTodos + completedSchedules} of {totalTodos + totalSchedules} done</Text>
            </Stack>
          </Card>
          <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.4)' }} component={motion.div} whileHover={{ scale: 1.02, y: -4 }}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Remaining</Text>
              <Title order={2}>{(totalTodos - completedTodos) + (totalSchedules - completedSchedules)}</Title>
              <Text size="xs" c={overdueTodos.length > 0 ? 'red' : 'dimmed'}>{overdueTodos.length > 0 ? `${overdueTodos.length} overdue` : 'On track'}</Text>
            </Stack>
          </Card>
        </SimpleGrid>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
              <Card withBorder padding="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                <Group justify="space-between" mb="md">
                  <Title order={3}><IconCalendar size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Today's Schedule</Title>
                  <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setScheduleModalOpen(true)}>Add</Button>
                </Group>
                {todaySchedules.length === 0 ? (
                  <Stack align="center" py="xl" gap="md">
                    <Text size="xl">🎉</Text>
                    <Title order={3}>Your day is clear</Title>
                    <Text c="dimmed">No schedules are planned for today.</Text>
                    <Group>
                      <Button leftSection={<IconPlus size={16} />} onClick={() => setScheduleModalOpen(true)}>Add Schedule</Button>
                      <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setTodoModalOpen(true)}>Add Todo</Button>
                    </Group>
                  </Stack>
                ) : (
                  <Timeline active={-1} bulletSize={16}>
                    {todaySchedules.map(schedule => {
                      const isActive = currentSchedule && currentSchedule.id === schedule.id;
                      const sts = getSubtasksForSchedule(schedule.id);
                      const sp = getScheduleProgress(schedule.id);
                      return (
                        <Timeline.Item key={schedule.id} bullet={<ThemeIcon size={16} radius="xl" color={isActive ? 'orange' : sts.length > 0 && sp === 100 ? 'green' : 'blue'} style={isActive ? { boxShadow: '0 0 20px rgba(249, 115, 22, 0.6)' } : {}}>{isActive ? <IconClock size={10} /> : <IconCalendar size={10} />}</ThemeIcon>}>
                          <Stack gap={4}>
                            {isActive && <Badge color="orange" variant="light" size="sm" style={{ boxShadow: '0 0 10px rgba(249, 115, 22, 0.4)' }}>🔶 CURRENTLY ACTIVE</Badge>}
                            <Group justify="space-between">
                              <Group gap="sm">
                                <Text fw={600} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => openDetail(schedule)} onMouseOver={(e) => e.target.style.color = '#3b82f6'} onMouseOut={(e) => e.target.style.color = 'inherit'}>{schedule.title}</Text>
                                {sts.length > 0 && <Badge size="xs" color={sp === 100 ? 'green' : 'violet'}>{sp}%</Badge>}
                              </Group>
                              <Group gap="xs">
                                <Text size="sm" c="dimmed">{schedule.startTime} – {schedule.endTime}</Text>
                                <ActionIcon size="sm" onClick={() => openDetail(schedule)}><IconEdit size={14} /></ActionIcon>
                                <ActionIcon size="sm" color="red" variant="subtle" onClick={() => deleteSchedule(schedule.id)}><IconTrash size={14} /></ActionIcon>
                              </Group>
                            </Group>
                            <Group gap="md" ml={0}>
                              <Badge variant="light">{schedule.category}</Badge>
                              {schedule.location && <Group gap={4}><IconMapPin size={14} /><Text size="sm" c="dimmed">{schedule.location}</Text></Group>}
                              <Badge color={schedule.priority === 'high' ? 'red' : schedule.priority === 'medium' ? 'yellow' : 'blue'} variant="light">{schedule.priority}</Badge>
                            </Group>
                          </Stack>
                        </Timeline.Item>
                      );
                    })}
                    {currentSchedule && (
                      <Timeline.Item bullet={<ThemeIcon size={16} radius="xl" color="orange" style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.6)' }}><IconClock size={10} /></ThemeIcon>}>
                        <Badge color="orange" style={{ boxShadow: '0 0 10px rgba(249, 115, 22, 0.4)' }}>CURRENT TIME - {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Badge>
                      </Timeline.Item>
                    )}
                  </Timeline>
                )}
              </Card>

              <Card withBorder padding="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                <Group justify="space-between" mb="md">
                  <Title order={3}><IconCheckbox size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Today's Todos</Title>
                  <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setTodoModalOpen(true)}>Add</Button>
                </Group>
                {todayTodos.length === 0 ? (
                  <Stack align="center" py="md" gap="sm">
                    <Text c="dimmed">No todos for today</Text>
                    <Button size="sm" leftSection={<IconPlus size={16} />} onClick={() => setTodoModalOpen(true)}>Add Todo</Button>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    {highTodos.length > 0 && (
                      <Stack gap="xs">
                        <Text fw={600}>🔥 High Priority</Text>
                        {highTodos.map(todo => (
                          <Paper key={todo.id} p="sm" withBorder style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                            <Group align="flex-start">
                              <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group justify="space-between">
                                  <Text td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                                  <ActionIcon size="sm" color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={14} /></ActionIcon>
                                </Group>
                                <Group gap="xs">
                                  <Badge color="red" size="xs">High</Badge>
                                  <Text size="xs" c="dimmed">⏰ {todo.dueTime}</Text>
                                  <Text size="xs" c="dimmed">📁 {todo.category}</Text>
                                </Group>
                              </Stack>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                    {mediumTodos.length > 0 && (
                      <Stack gap="xs">
                        <Text fw={600}>⚡ Medium Priority</Text>
                        {mediumTodos.map(todo => (
                          <Paper key={todo.id} p="sm" withBorder style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                            <Group align="flex-start">
                              <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group justify="space-between">
                                  <Text td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                                  <ActionIcon size="sm" color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={14} /></ActionIcon>
                                </Group>
                                <Group gap="xs">
                                  <Badge color="yellow" size="xs">Medium</Badge>
                                  <Text size="xs" c="dimmed">⏰ {todo.dueTime}</Text>
                                  <Text size="xs" c="dimmed">📁 {todo.category}</Text>
                                </Group>
                              </Stack>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                    {lowTodos.length > 0 && (
                      <Stack gap="xs">
                        <Text fw={600}>📝 Low Priority</Text>
                        {lowTodos.map(todo => (
                          <Paper key={todo.id} p="sm" withBorder style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                            <Group align="flex-start">
                              <Checkbox checked={todo.completed} onChange={() => toggleTodo(todo.id)} mt={2} />
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group justify="space-between">
                                  <Text td={todo.completed ? 'line-through' : 'none'} c={todo.completed ? 'dimmed' : undefined}>{todo.title}</Text>
                                  <ActionIcon size="sm" color="red" variant="subtle" onClick={() => deleteTodo(todo.id)}><IconTrash size={14} /></ActionIcon>
                                </Group>
                                <Group gap="xs">
                                  <Badge color="blue" size="xs">Low</Badge>
                                  <Text size="xs" c="dimmed">⏰ {todo.dueTime}</Text>
                                  <Text size="xs" c="dimmed">📁 {todo.category}</Text>
                                </Group>
                              </Stack>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)', backdropFilter: 'blur(15px)', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
                <Stack gap="xs">
                  <Text fw={600} style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✨ Up Next</Text>
                  {nextSchedule ? (
                    <Stack gap={4}>
                      <Text size="lg" fw={600} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => openDetail(nextSchedule)} onMouseOver={(e) => e.target.style.color = '#3b82f6'} onMouseOut={(e) => e.target.style.color = 'inherit'}>{nextSchedule.title}</Text>
                      <Text c="dimmed">{nextSchedule.startTime} – {nextSchedule.endTime}</Text>
                      <Text size="xl" fw={700} style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Starts in: {countdown}</Text>
                    </Stack>
                  ) : (
                    <Text fw={500}>No more scheduled events today.</Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder padding="md" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                <Stack gap="sm">
                  <Title order={4}><IconTarget size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Overall Task Progress</Title>
                  <Stack gap={6} align="center">
                    <Text size="3rem" fw={700} style={{ background: overall >= 70 ? 'linear-gradient(45deg, #10b981, #3b82f6)' : overall >= 40 ? 'linear-gradient(45deg, #f59e0b, #f97316)' : 'linear-gradient(45deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{overall}%</Text>
                    <Progress value={overall} size="lg" w="100%" color={overall >= 70 ? 'green' : overall >= 40 ? 'yellow' : 'red'} />
                    <Text size="sm" c="dimmed">{completedTodos + completedSchedules} completed out of {totalTodos + totalSchedules} total items</Text>
                    <Group grow w="100%">
                      <Stack gap={2} align="center">
                        <Text fw={600} c="blue">{completedTodos}/{totalTodos}</Text>
                        <Text size="xs" c="dimmed">Todos</Text>
                      </Stack>
                      <Stack gap={2} align="center">
                        <Text fw={600} c="violet">{completedSchedules}/{totalSchedules}</Text>
                        <Text size="xs" c="dimmed">Schedules</Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Stack>
              </Card>

              <Card withBorder padding="md" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                <Stack gap="sm">
                  <Title order={4}><IconClock size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Daily Time Utilization</Title>
                  <Stack gap={6}>
                    <Group justify="space-between"><Text size="sm">Scheduled:</Text><Text size="sm" fw={600} c="blue">{formatMinutes(scheduledMins)}</Text></Group>
                    <Group justify="space-between"><Text size="sm">Free:</Text><Text size="sm" fw={600} c="green">{formatMinutes(freeMins)}</Text></Group>
                    <Group justify="space-between"><Text size="sm">Completed:</Text><Text size="sm" fw={600} c="violet">{formatMinutes(completedScheduledMins)}</Text></Group>
                    <Group justify="space-between"><Text size="sm">Remaining:</Text><Text size="sm" fw={600} c="orange">{formatMinutes(scheduledMins - completedScheduledMins)}</Text></Group>
                  </Stack>
                </Stack>
              </Card>

              <Card withBorder padding="md" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
                <Stack gap="sm">
                  <Title order={4}>Quick Actions</Title>
                  <SimpleGrid cols={2} spacing="xs">
                    <Button variant="light" size="sm" leftSection={<IconPlus size={14} />} onClick={() => setTodoModalOpen(true)}>Add Todo</Button>
                    <Button variant="light" size="sm" leftSection={<IconPlus size={14} />} onClick={() => setScheduleModalOpen(true)}>Add Schedule</Button>
                    <Button variant="subtle" size="sm" style={{ gridColumn: '1 / -1' }} onClick={() => navigate('/calendar')}>View Calendar</Button>
                    <Button variant="subtle" size="sm" style={{ gridColumn: '1 / -1' }} onClick={() => navigate('/schedules')}>View All Schedules</Button>
                  </SimpleGrid>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Card withBorder padding="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
          <Group justify="space-between" mb="md">
            <Stack gap={2}>
              <Title order={3}>Tomorrow</Title>
              <Text c="dimmed">{new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </Stack>
            <Button variant="light" rightSection={<IconChevronRight size={16} />} onClick={() => navigate('/calendar')}>View Tomorrow</Button>
          </Group>
          <Stack gap="xs">
            {tomorrowSchedules.length === 0 ? (
              <Text c="dimmed">No schedules tomorrow</Text>
            ) : (
              tomorrowSchedules.slice(0, 3).map(s => <Text key={s.id} c="dimmed" style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => openDetail(s)} onMouseOver={(e) => e.target.style.color = '#3b82f6'} onMouseOut={(e) => e.target.style.color = 'inherit'}>{s.startTime} — {s.title} {s.category && `(${s.category})`}</Text>)
            )}
            <Text size="sm" c="dimmed">
              {tomorrowTodos.length > 0 ? `${tomorrowTodos.length} todo${tomorrowTodos.length === 1 ? '' : 's'} tomorrow` : 'No todos tomorrow'}
            </Text>
          </Stack>
        </Card>
      </Stack>

      <Modal opened={todoModalOpen} onClose={() => setTodoModalOpen(false)} title="Add New Todo" centered>
        <Stack gap="md">
          <TextInput label="Title" placeholder="Enter todo title" required value={newTodo.title} onChange={(e) => setNewTodo({...newTodo, title: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newTodo.priority} onChange={(v) => setNewTodo({...newTodo, priority: v})} />
          <TextInput label="Due Time" type="time" value={newTodo.dueTime} onChange={(e) => setNewTodo({...newTodo, dueTime: e.target.value})} />
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Study',label:'Study'},{value:'School',label:'School'},{value:'Fitness',label:'Fitness'}]} value={newTodo.category} onChange={(v) => setNewTodo({...newTodo, category: v})} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setTodoModalOpen(false)}>Cancel</Button>
            <Button onClick={addTodo}>Add Todo</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Add New Schedule" centered>
        <Stack gap="md">
          <TextInput label="Title" placeholder="Enter schedule title" required value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} />
          <Group grow>
            <TextInput label="Start Time" type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} />
            <TextInput label="End Time" type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} />
          </Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={newSchedule.category} onChange={(v) => setNewSchedule({...newSchedule, category: v})} />
          <TextInput label="Location" placeholder="Enter location (optional)" value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newSchedule.priority} onChange={(v) => setNewSchedule({...newSchedule, priority: v})} />
          <Textarea label="Description" value={newSchedule.description} onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={addSchedule}>Add Schedule</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedSchedule?.title} size="lg" centered>
        {selectedSchedule && (
          <Stack gap="md">
            <Group gap="xs">
              <Badge>{selectedSchedule.category}</Badge>
              <Badge color={selectedSchedule.priority === 'high' ? 'red' : selectedSchedule.priority === 'medium' ? 'yellow' : 'blue'}>{selectedSchedule.priority}</Badge>
              <Text size="sm" c="dimmed">{selectedSchedule.date} {selectedSchedule.startTime}-{selectedSchedule.endTime}</Text>
              {selectedSchedule.location && <Text size="sm" c="dimmed">📍 {selectedSchedule.location}</Text>}
            </Group>
            {selectedSchedule.description && <Text>{selectedSchedule.description}</Text>}
            <Text fw={600}>Subtasks ({getSubtasksForSchedule(selectedSchedule.id).filter(s=>s.completed).length}/{getSubtasksForSchedule(selectedSchedule.id).length})</Text>
            <Stack gap="xs">
              {getSubtasksForSchedule(selectedSchedule.id).map(st => (
                <Paper key={st.id} p="sm" withBorder>
                  <Group justify="space-between">
                    <Group gap="sm" style={{ flex: 1 }}>
                      <Checkbox checked={st.completed} onChange={() => toggleSubtask(st.id)} />
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text fw={500} td={st.completed ? 'line-through' : 'none'} c={st.completed ? 'dimmed' : undefined}>{st.title}</Text>
                        {st.description && <Text size="sm" c="dimmed">{st.description}</Text>}
                      </Stack>
                    </Group>
                    <ActionIcon color="red" size="sm" onClick={() => deleteSubtask(st.id)}><IconTrash size={14} /></ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
            <Card withBorder p="sm">
              <Stack gap="xs">
                <Text fw={500}>Add Subtask</Text>
                <TextInput placeholder="Subtask title" value={newSubtask.title} onChange={(e) => setNewSubtask({...newSubtask, title: e.target.value})} />
                <Textarea placeholder="Description (optional)" value={newSubtask.description} onChange={(e) => setNewSubtask({...newSubtask, description: e.target.value})} />
                <Button size="sm" onClick={addSubtask}>Add Subtask</Button>
              </Stack>
            </Card>
            <Button variant="light" onClick={() => { setDetailModalOpen(false); navigate('/schedules'); }}>Manage in Schedules Page</Button>
          </Stack>
        )}
      </Modal>
    </Layout>
  );
}

export default Dashboard;
