import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Card, Group, Stack, Button, Badge, Paper, ActionIcon, Modal, TextInput, Select, Progress, Checkbox, Textarea } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconClock, IconMapPin, IconEdit, IconChevronRight } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

function SchedulesPage({ user }) {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });
  const [newSchedule, setNewSchedule] = useState({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', date: new Date().toISOString().split('T')[0], description: '' });
  const [editSchedule, setEditSchedule] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSchedules(JSON.parse(localStorage.getItem('schedules') || '[]'));
    setSubtasks(JSON.parse(localStorage.getItem('subtasks') || '[]'));
  };

  const deleteSchedule = (id) => {
    const updated = schedules.filter(s => s.id !== id);
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    toast.success('Schedule deleted');
  };

  const addSchedule = () => {
    if (!newSchedule.title) return toast.error('Please enter a title');
    const schedule = { id: Date.now(), ...newSchedule, completed: false };
    const updated = [...schedules, schedule];
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    setModalOpen(false);
    setNewSchedule({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', date: new Date().toISOString().split('T')[0], description: '' });
    toast.success('Schedule added!');
  };

  const updateSchedule = () => {
    if (!editSchedule?.title) return toast.error('Please enter a title');
    const updated = schedules.map(s => s.id === editSchedule.id ? editSchedule : s);
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    setEditSchedule(null);
    toast.success('Schedule updated!');
  };

  const openDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailModalOpen(true);
  };

  const addSubtask = () => {
    if (!newSubtask.title) return toast.error('Please enter title');
    const subtask = { id: Date.now(), scheduleId: selectedSchedule.id, title: newSubtask.title, description: newSubtask.description, completed: false, createdAt: new Date().toISOString() };
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
    toast.success('Subtask deleted');
  };

  const moveToDate = (date) => {
    if (!editSchedule) return;
    const updated = schedules.map(s => s.id === editSchedule.id ? { ...editSchedule, date } : s);
    localStorage.setItem('schedules', JSON.stringify(updated));
    setSchedules(updated);
    setEditSchedule({ ...editSchedule, date });
    toast.success('Moved to ' + date);
  };

  const getSubtasksForSchedule = (scheduleId) => subtasks.filter(st => st.scheduleId === scheduleId);
  const getProgress = (scheduleId) => {
    const sts = getSubtasksForSchedule(scheduleId);
    if (sts.length === 0) return 0;
    const done = sts.filter(st => st.completed).length;
    return Math.round((done / sts.length) * 100);
  };

  const sorted = [...schedules].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}><IconClock size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />Schedules</Title>
            <Text c="dimmed">Manage all your events with subtasks</Text>
          </Stack>
          <Group>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>Add Schedule</Button>
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back</Button>
          </Group>
        </Group>

        <Card withBorder padding="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)' }}>
          <Stack gap="md">
            {sorted.map(schedule => {
              const sts = getSubtasksForSchedule(schedule.id);
              const progress = getProgress(schedule.id);
              return (
                <Paper key={schedule.id} p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => openDetail(schedule)}>
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text fw={600} size="lg">{schedule.title}</Text>
                          <Badge color={schedule.priority === 'high' ? 'red' : schedule.priority === 'medium' ? 'yellow' : 'blue'}>{schedule.priority}</Badge>
                          <Badge variant="light">{schedule.category}</Badge>
                          {sts.length > 0 && <Badge color="violet">{sts.filter(s=>s.completed).length}/{sts.length} tasks</Badge>}
                        </Group>
                        <Group gap="md">
                          <Text size="sm" c="dimmed">📅 {schedule.date}</Text>
                          <Text size="sm" c="dimmed">🕐 {schedule.startTime} - {schedule.endTime}</Text>
                          {schedule.location && <Group gap={4}><IconMapPin size={14} /><Text size="sm" c="dimmed">{schedule.location}</Text></Group>}
                        </Group>
                        {schedule.description && <Text size="sm" c="dimmed">{schedule.description}</Text>}
                      </Stack>
                      <Group gap="xs">
                        <ActionIcon onClick={(e) => { e.stopPropagation(); setEditSchedule(schedule); }}><IconEdit size={16} /></ActionIcon>
                        <ActionIcon color="red" onClick={(e) => { e.stopPropagation(); deleteSchedule(schedule.id); }}><IconTrash size={16} /></ActionIcon>
                        <IconChevronRight size={16} />
                      </Group>
                    </Group>
                    {sts.length > 0 && (
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Subtasks Progress</Text>
                          <Text size="sm" fw={500}>{progress}%</Text>
                        </Group>
                        <Progress value={progress} color={progress === 100 ? 'green' : 'blue'} size="sm" />
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              );
            })}
            {schedules.length === 0 && (
              <Stack align="center" py="xl">
                <Text c="dimmed">No schedules yet. Add your first schedule!</Text>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>Add Schedule</Button>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add New Schedule" centered size="md">
        <Stack gap="md">
          <TextInput label="Title" required value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} />
          <TextInput label="Date" type="date" value={newSchedule.date} onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})} />
          <Group grow>
            <TextInput label="Start Time" type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} />
            <TextInput label="End Time" type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} />
          </Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={newSchedule.category} onChange={(v) => setNewSchedule({...newSchedule, category: v})} />
          <TextInput label="Location" value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={newSchedule.priority} onChange={(v) => setNewSchedule({...newSchedule, priority: v})} />
          <Textarea label="Description" value={newSchedule.description} onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setModalOpen(false)}>Cancel</Button>
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
          </Stack>
        )}
      </Modal>

      <Modal opened={!!editSchedule} onClose={() => setEditSchedule(null)} title="Edit Schedule" centered>
        {editSchedule && <Stack gap="md">
          <TextInput label="Title" required value={editSchedule.title} onChange={(e) => setEditSchedule({...editSchedule, title: e.target.value})} />
          <TextInput label="Move to Date" type="date" value={editSchedule.date} onChange={(e) => moveToDate(e.target.value)} />
          <Group grow>
            <TextInput label="Start Time" type="time" value={editSchedule.startTime} onChange={(e) => setEditSchedule({...editSchedule, startTime: e.target.value})} />
            <TextInput label="End Time" type="time" value={editSchedule.endTime} onChange={(e) => setEditSchedule({...editSchedule, endTime: e.target.value})} />
          </Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={editSchedule.category} onChange={(v) => setEditSchedule({...editSchedule, category: v})} />
          <TextInput label="Location" value={editSchedule.location || ''} onChange={(e) => setEditSchedule({...editSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={editSchedule.priority} onChange={(v) => setEditSchedule({...editSchedule, priority: v})} />
          <Textarea label="Description" value={editSchedule.description || ''} onChange={(e) => setEditSchedule({...editSchedule, description: e.target.value})} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setEditSchedule(null)}>Cancel</Button>
            <Button onClick={updateSchedule}>Save</Button>
          </Group>
        </Stack>}
      </Modal>
    </Layout>
  );
}

export default SchedulesPage;
