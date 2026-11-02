import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Card, Group, Stack, Button, Badge, Grid, ActionIcon, Modal, TextInput, Select, Radio } from '@mantine/core';
import { IconArrowLeft, IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconEdit, IconRepeat } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useMediaQuery } from '@mantine/hooks';
import Layout from '../components/Layout';
import SubtaskChecklist from '../components/SubtaskChecklist';
import { loadSubtasks, subtaskHandlers, draftHandlers } from '../utils/subtasks';
import RecurrenceFields from '../components/RecurrenceFields';
import { refreshTodoReminders } from '../utils/reminders';
import useScheduleActions, { SCOPE_OPTIONS } from '../hooks/useScheduleActions';
import { NO_REPEAT } from '../utils/recurrence';

function Calendar({ user }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [todos, setTodos] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [draftSubtasks, setDraftSubtasks] = useState([]);
  const [repeat, setRepeat] = useState(NO_REPEAT);
  const [editScope, setEditScope] = useState('one');
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [editTodo, setEditTodo] = useState(null);
  const [newSchedule, setNewSchedule] = useState({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium' });
  const [newTodo, setNewTodo] = useState({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSchedules(JSON.parse(localStorage.getItem('schedules') || '[]'));
    setTodos(JSON.parse(localStorage.getItem('todos') || '[]'));
    setSubtasks(loadSubtasks());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const today = () => setCurrentDate(new Date());

  const getDateStr = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getDayItems = (day) => {
    const dateStr = getDateStr(day);
    const daySchedules = schedules.filter(s => s.date === dateStr);
    const dayTodos = todos.filter(t => t.dueDate === dateStr);
    return { schedules: daySchedules, todos: dayTodos, dateStr };
  };

  const openDay = (day) => {
    const { dateStr } = getDayItems(day);
    setSelectedDate(dateStr);
    setDayModalOpen(true);
  };

  const actions = useScheduleActions({ schedules, subtasks, setSchedules, setSubtasks });

  const addSchedule = () => {
    if (!actions.add({ base: { ...newSchedule, date: selectedDate }, rule: repeat, drafts: draftSubtasks })) return;
    setDraftSubtasks([]);
    setRepeat(NO_REPEAT);
    setScheduleModalOpen(false);
    setNewSchedule({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium' });
  };

  const updateSchedule = () => {
    if (actions.save(editSchedule, editScope)) setEditSchedule(null);
  };

  const addTodo = () => {
    if (!newTodo.title) return toast.error('Please enter a title');
    const todo = { id: Date.now(), ...newTodo, dueDate: selectedDate, completed: false };
    const updated = [...todos, todo];
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    setTodoModalOpen(false);
    setNewTodo({ title: '', priority: 'medium', dueTime: '09:00', category: 'Personal' });
    toast.success('Todo added!');
  };

  const updateTodo = () => {
    if (!editTodo?.title) return toast.error('Please enter a title');
    const updated = todos.map(t => t.id === editTodo.id ? editTodo : t);
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    setEditTodo(null);
    toast.success('Todo updated!');
  };

  const deleteTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    toast.success('Todo deleted');
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem('todos', JSON.stringify(updated));
    refreshTodoReminders();
    setTodos(updated);
    toast.success('Updated');
  };

  const daySchedules = selectedDate ? schedules.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime)) : [];
  const dayTodosList = selectedDate ? todos.filter(t => t.dueDate === selectedDate) : [];

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}>Calendar</Title>
            <Text c="dimmed">Click on a day to view and manage events</Text>
          </Stack>
          <Button variant="subtle" visibleFrom="sm" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Group>

        <Card withBorder padding={isMobile ? 'xs' : 'lg'} style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
          <Group justify="space-between" mb="lg" wrap="nowrap">
            <Title order={2} style={{ whiteSpace: 'nowrap' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Title>
            <Group gap="xs">
              <ActionIcon variant="subtle" onClick={prevMonth}><IconChevronLeft size={18} /></ActionIcon>
              <Button variant="subtle" size="xs" onClick={today}>Today</Button>
              <ActionIcon variant="subtle" onClick={nextMonth}><IconChevronRight size={18} /></ActionIcon>
            </Group>
          </Group>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isMobile ? 4 : 8 }}>
            {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
              <Text key={i} ta="center" fw={600} c="dimmed" size="sm" py="xs">{day}</Text>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { schedules: daySchedules, todos: dayTodos } = getDayItems(day);
              const isToday = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() && day === new Date().getDate();
              const priorityColor = (p) => (p === 'high' ? 'red' : p === 'medium' ? 'yellow' : 'blue');
              const total = daySchedules.length + dayTodos.length;
              return (
                <Card
                  key={day}
                  component="button"
                  type="button"
                  aria-label={`${monthNames[currentDate.getMonth()]} ${day}, ${total} item${total === 1 ? '' : 's'}`}
                  padding={isMobile ? 4 : 'xs'}
                  h={isMobile ? 56 : 110}
                  onClick={() => openDay(day)}
                  style={{ background: isToday ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.5)', border: `1px solid ${isToday ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-dark-4)'}`, cursor: 'pointer', textAlign: 'left', color: 'inherit', overflow: 'hidden' }}
                >
                  <Text fw={isToday ? 700 : 500} c={isToday ? 'blue' : undefined} size="sm" ta={isMobile ? 'center' : undefined}>{day}</Text>
                  {isMobile ? (
                    <Group gap={3} justify="center" mt={6} wrap="nowrap">
                      {[...daySchedules, ...dayTodos].slice(0, 3).map((item) => (
                        <span key={`${item.id}-${item.title}`} style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--mantine-color-${priorityColor(item.priority)}-5)` }} />
                      ))}
                    </Group>
                  ) : (
                    <Stack gap={2} mt={4}>
                      {daySchedules.slice(0, 2).map(s => (
                        <Badge key={s.id} size="xs" variant="light" fullWidth color={priorityColor(s.priority)}>{s.title}</Badge>
                      ))}
                      {dayTodos.slice(0, 1).map(t => (
                        <Badge key={t.id} size="xs" variant="dot" fullWidth color={priorityColor(t.priority)}>{t.title}</Badge>
                      ))}
                      {total > 3 && <Text size="xs" c="dimmed">+{total - 3}</Text>}
                    </Stack>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      </Stack>

      <Modal opened={dayModalOpen} onClose={() => setDayModalOpen(false)} title={`Events for ${selectedDate}`} size="lg" centered>
        <Stack gap="md">
          <Group>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setDayModalOpen(false); setScheduleModalOpen(true); }}>Add Schedule</Button>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setDayModalOpen(false); setTodoModalOpen(true); }}>Add Todo</Button>
          </Group>
          <Text fw={600}>Schedules</Text>
          {daySchedules.length === 0 ? <Text size="sm" c="dimmed">No schedules</Text> : daySchedules.map(s => (
            <Card key={s.id} padding="sm" withBorder>
              <Group justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <Text fw={500}>{s.title}</Text>
                    {s.seriesId && <IconRepeat size={14} color="var(--mantine-color-grape-4)" aria-label="Repeats" />}
                    {(() => {
                      const sts = subtasks.filter((st) => st.scheduleId === s.id);
                      const done = sts.filter((st) => st.completed).length;
                      return sts.length > 0 && <Badge size="xs" variant="light" color={done === sts.length ? 'green' : 'violet'}>{done}/{sts.length} subtasks</Badge>;
                    })()}
                  </Group>
                  <Text size="sm" c="dimmed">{s.startTime} - {s.endTime} {s.location && `• ${s.location}`}</Text>
                  <Group gap="xs"><Badge size="xs">{s.category}</Badge><Badge size="xs" color={s.priority === 'high' ? 'red' : s.priority === 'medium' ? 'yellow' : 'blue'}>{s.priority}</Badge></Group>
                </Stack>
                <Group gap="xs">
                  <ActionIcon size="sm" onClick={() => { setEditScope('one'); setEditSchedule(s); setDayModalOpen(false); }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon size="sm" color="red" onClick={() => actions.requestDelete(s)}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
          <Text fw={600}>Todos</Text>
          {dayTodosList.length === 0 ? <Text size="sm" c="dimmed">No todos</Text> : dayTodosList.map(t => (
            <Card key={t.id} padding="sm" withBorder>
              <Group justify="space-between">
                <Group gap="sm">
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id)} />
                  <Stack gap={2}>
                    <Text fw={500} td={t.completed ? 'line-through' : 'none'} c={t.completed ? 'dimmed' : undefined}>{t.title}</Text>
                    <Text size="sm" c="dimmed">{t.dueTime} • {t.category}</Text>
                  </Stack>
                </Group>
                <Group gap="xs">
                  <ActionIcon size="sm" onClick={() => { setEditTodo(t); setDayModalOpen(false); }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon size="sm" color="red" onClick={() => deleteTodo(t.id)}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </Modal>

      <Modal opened={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Add Schedule" centered>
        <Stack gap="md">
          <TextInput label="Title" required value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} />
          <Group grow><TextInput label="Start Time" type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} /><TextInput label="End Time" type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} /></Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={newSchedule.category} onChange={(v) => setNewSchedule({...newSchedule, category: v})} />
          <TextInput label="Location" value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newSchedule.priority} onChange={(v) => setNewSchedule({...newSchedule, priority: v})} />
          <RecurrenceFields value={repeat} onChange={setRepeat} startDate={selectedDate} />
          <SubtaskChecklist draft items={draftSubtasks} {...draftHandlers(draftSubtasks, setDraftSubtasks)} />
          <Group justify="flex-end"><Button variant="subtle" onClick={() => setScheduleModalOpen(false)}>Cancel</Button><Button onClick={addSchedule}>Add</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={todoModalOpen} onClose={() => setTodoModalOpen(false)} title="Add Todo" centered>
        <Stack gap="md">
          <TextInput label="Title" required value={newTodo.title} onChange={(e) => setNewTodo({...newTodo, title: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newTodo.priority} onChange={(v) => setNewTodo({...newTodo, priority: v})} />
          <TextInput label="Due Time" type="time" value={newTodo.dueTime} onChange={(e) => setNewTodo({...newTodo, dueTime: e.target.value})} />
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Study',label:'Study'},{value:'School',label:'School'},{value:'Fitness',label:'Fitness'}]} value={newTodo.category} onChange={(v) => setNewTodo({...newTodo, category: v})} />
          <Group justify="flex-end"><Button variant="subtle" onClick={() => setTodoModalOpen(false)}>Cancel</Button><Button onClick={addTodo}>Add</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={!!editSchedule} onClose={() => setEditSchedule(null)} title="Edit Schedule" centered>
        {editSchedule && <Stack gap="md">
          <TextInput label="Title" required value={editSchedule.title} onChange={(e) => setEditSchedule({...editSchedule, title: e.target.value})} />
          <Group grow><TextInput label="Start Time" type="time" value={editSchedule.startTime} onChange={(e) => setEditSchedule({...editSchedule, startTime: e.target.value})} /><TextInput label="End Time" type="time" value={editSchedule.endTime} onChange={(e) => setEditSchedule({...editSchedule, endTime: e.target.value})} /></Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={editSchedule.category} onChange={(v) => setEditSchedule({...editSchedule, category: v})} />
          <TextInput label="Location" value={editSchedule.location || ''} onChange={(e) => setEditSchedule({...editSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={editSchedule.priority} onChange={(v) => setEditSchedule({...editSchedule, priority: v})} />
          <SubtaskChecklist items={subtasks.filter((st) => st.scheduleId === editSchedule.id)} {...subtaskHandlers(subtasks, editSchedule.id, setSubtasks)} />
          {editSchedule.seriesId && (
            <Radio.Group label="Apply changes to" value={editScope} onChange={setEditScope} description="Date, completion and subtasks stay per event">
              <Stack gap="xs" mt="xs">
                {SCOPE_OPTIONS.map((o) => <Radio key={o.value} value={o.value} label={o.label} />)}
              </Stack>
            </Radio.Group>
          )}
          <Group justify="flex-end"><Button variant="subtle" onClick={() => setEditSchedule(null)}>Cancel</Button><Button onClick={updateSchedule}>Save</Button></Group>
        </Stack>}
      </Modal>

      <Modal opened={!!editTodo} onClose={() => setEditTodo(null)} title="Edit Todo" centered>
        {editTodo && <Stack gap="md">
          <TextInput label="Title" required value={editTodo.title} onChange={(e) => setEditTodo({...editTodo, title: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={editTodo.priority} onChange={(v) => setEditTodo({...editTodo, priority: v})} />
          <TextInput label="Due Time" type="time" value={editTodo.dueTime} onChange={(e) => setEditTodo({...editTodo, dueTime: e.target.value})} />
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Study',label:'Study'},{value:'School',label:'School'},{value:'Fitness',label:'Fitness'}]} value={editTodo.category} onChange={(v) => setEditTodo({...editTodo, category: v})} />
          <Group justify="flex-end"><Button variant="subtle" onClick={() => setEditTodo(null)}>Cancel</Button><Button onClick={updateTodo}>Save</Button></Group>
        </Stack>}
      </Modal>
      {actions.deleteDialog}
    </Layout>
  );
}

export default Calendar;
