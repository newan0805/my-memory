import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Card, Group, Stack, Button, Badge, Paper, ActionIcon, Modal, TextInput, Select, Progress, Textarea, Collapse, Radio, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconClock, IconMapPin, IconEdit, IconChevronDown, IconSubtask, IconRepeat } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { getLocalDateStr } from '../utils/date';
import SubtaskChecklist from '../components/SubtaskChecklist';
import DateFilter, { useDateFilter, getDateRange, isInRange, sortByDate } from '../components/DateFilter';
import { loadSubtasks, subtaskHandlers, draftHandlers } from '../utils/subtasks';
import RecurrenceFields from '../components/RecurrenceFields';
import useScheduleActions, { SCOPE_OPTIONS } from '../hooks/useScheduleActions';
import { NO_REPEAT, describeRule } from '../utils/recurrence';

const PRIORITY_COLORS = { high: '#f87171', medium: '#facc15', low: '#60a5fa' };

const formatPart = (dateStr, options) => new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', options);

const isNow = (schedule) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return schedule.date === getLocalDateStr(now) && schedule.startTime <= time && time < (schedule.endTime > schedule.startTime ? schedule.endTime : '24:00');
};

function SchedulesPage({ user }) {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [draftSubtasks, setDraftSubtasks] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [newSchedule, setNewSchedule] = useState({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', date: getLocalDateStr(), description: '' });
  const [editSchedule, setEditSchedule] = useState(null);
  const [editScope, setEditScope] = useState('one');
  const [repeat, setRepeat] = useState(NO_REPEAT);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSchedules(JSON.parse(localStorage.getItem('schedules') || '[]'));
    setSubtasks(loadSubtasks());
  };

  const actions = useScheduleActions({ schedules, subtasks, setSchedules, setSubtasks });

  const addSchedule = () => {
    if (!actions.add({ base: newSchedule, rule: repeat, drafts: draftSubtasks })) return;
    setDraftSubtasks([]);
    setRepeat(NO_REPEAT);
    setModalOpen(false);
    setNewSchedule({ title: '', startTime: '09:00', endTime: '10:00', category: 'Work', location: '', priority: 'medium', date: getLocalDateStr(), description: '' });
  };

  const updateSchedule = () => {
    if (actions.save(editSchedule, editScope)) setEditSchedule(null);
  };

  const openEdit = (schedule) => {
    setEditScope('one');
    setEditSchedule(schedule);
  };

  const openDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailModalOpen(true);
  };

  const getSubtasksForSchedule = (scheduleId) => subtasks.filter(st => st.scheduleId === scheduleId);
  const getProgress = (scheduleId) => {
    const sts = getSubtasksForSchedule(scheduleId);
    if (sts.length === 0) return 0;
    const done = sts.filter(st => st.completed).length;
    return Math.round((done / sts.length) * 100);
  };

  const [filter, setFilter] = useDateFilter('schedules', { preset: 'week', sort: 'asc' });
  const range = getDateRange(filter);
  const today = getLocalDateStr();
  const sorted = sortByDate(schedules.filter(s => isInRange(s.date, range)), filter.sort, s => s.date, s => s.startTime);

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
            <Button variant="subtle" visibleFrom="sm" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back</Button>
          </Group>
        </Group>

        <DateFilter value={filter} onChange={setFilter} />

        <Card withBorder padding="lg" radius="lg" className="glass-panel">
          <Stack gap="sm">
            {sorted.map(schedule => {
              const sts = getSubtasksForSchedule(schedule.id);
              const progress = getProgress(schedule.id);
              return (
                <Paper
                  key={schedule.id}
                  p="md"
                  className={`glass-card is-clickable${schedule.completed ? ' is-done' : ''}`}
                  style={{ '--accent': PRIORITY_COLORS[schedule.priority] || PRIORITY_COLORS.medium }}
                  onClick={() => openDetail(schedule)}
                >
                  <Group align="flex-start" wrap="nowrap" gap="md">
                    <div className={`date-tile${schedule.date === today ? ' is-today' : ''}`}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{formatPart(schedule.date, { weekday: 'short' })}</Text>
                      <Text fw={700} size="xl" lh={1.1}>{formatPart(schedule.date, { day: 'numeric' })}</Text>
                      <Text size="xs" c="dimmed" tt="uppercase">{formatPart(schedule.date, { month: 'short' })}</Text>
                    </div>

                    <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                        <Text fw={600} size="md" lineClamp={2} style={{ flex: 1, minWidth: 0 }}>{schedule.title}</Text>
                        <Group gap={2} wrap="nowrap">
                          <ActionIcon variant="subtle" aria-label="Edit schedule" onClick={(e) => { e.stopPropagation(); openEdit(schedule); }}><IconEdit size={16} /></ActionIcon>
                          <ActionIcon variant="subtle" color="red" aria-label="Delete schedule" onClick={(e) => { e.stopPropagation(); actions.requestDelete(schedule); }}><IconTrash size={16} /></ActionIcon>
                        </Group>
                      </Group>

                      <Group gap="sm" wrap="wrap">
                        <Group gap={4} wrap="nowrap"><IconClock size={14} color="var(--mantine-color-dimmed)" /><Text size="sm" c="dimmed">{schedule.startTime} – {schedule.endTime}</Text></Group>
                        {schedule.location && <Group gap={4} wrap="nowrap"><IconMapPin size={14} color="var(--mantine-color-dimmed)" /><Text size="sm" c="dimmed" lineClamp={1}>{schedule.location}</Text></Group>}
                        {isNow(schedule) && <Badge size="sm" color="orange" variant="filled">Now</Badge>}
                      </Group>

                      <Group gap={6} wrap="wrap">
                        <Badge size="sm" variant="dot" color={schedule.priority === 'high' ? 'red' : schedule.priority === 'medium' ? 'yellow' : 'blue'}>{schedule.priority}</Badge>
                        <Badge size="sm" variant="light">{schedule.category}</Badge>
                        {schedule.seriesId && (
                          <Tooltip label={describeRule(schedule.recurrence)}>
                            <Badge size="sm" variant="light" color="grape" leftSection={<IconRepeat size={11} />}>Repeats</Badge>
                          </Tooltip>
                        )}
                      </Group>

                      {schedule.description && <Text size="sm" c="dimmed" lineClamp={2}>{schedule.description}</Text>}

                      <Group gap="sm" wrap="nowrap" mt={2}>
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          leftSection={<IconSubtask size={14} />}
                          rightSection={<IconChevronDown size={14} style={{ transform: expanded[schedule.id] ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />}
                          onClick={(e) => { e.stopPropagation(); setExpanded({ ...expanded, [schedule.id]: !expanded[schedule.id] }); }}
                        >
                          {sts.length > 0 ? `${sts.filter((st) => st.completed).length}/${sts.length} subtasks` : 'Add subtasks'}
                        </Button>
                        {sts.length > 0 && <Progress value={progress} color={progress === 100 ? 'green' : 'violet'} size="sm" radius="xl" style={{ flex: 1 }} />}
                      </Group>

                      <Collapse in={!!expanded[schedule.id]}>
                        <SubtaskChecklist items={sts} {...subtaskHandlers(subtasks, schedule.id, setSubtasks)} />
                      </Collapse>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
            {sorted.length === 0 && (
              <Stack align="center" py="xl">
                <Text c="dimmed">{schedules.length === 0 ? 'No schedules yet. Add your first schedule!' : 'No schedules in this date range.'}</Text>
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
          <RecurrenceFields value={repeat} onChange={setRepeat} startDate={newSchedule.date} />
          <SubtaskChecklist draft items={draftSubtasks} {...draftHandlers(draftSubtasks, setDraftSubtasks)} />
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
            <SubtaskChecklist items={getSubtasksForSchedule(selectedSchedule.id)} {...subtaskHandlers(subtasks, selectedSchedule.id, setSubtasks)} />
          </Stack>
        )}
      </Modal>

      <Modal opened={!!editSchedule} onClose={() => setEditSchedule(null)} title="Edit Schedule" centered>
        {editSchedule && <Stack gap="md">
          <TextInput label="Title" required value={editSchedule.title} onChange={(e) => setEditSchedule({...editSchedule, title: e.target.value})} />
          <TextInput label="Date" type="date" value={editSchedule.date} onChange={(e) => setEditSchedule({ ...editSchedule, date: e.target.value })} />
          <Group grow>
            <TextInput label="Start Time" type="time" value={editSchedule.startTime} onChange={(e) => setEditSchedule({...editSchedule, startTime: e.target.value})} />
            <TextInput label="End Time" type="time" value={editSchedule.endTime} onChange={(e) => setEditSchedule({...editSchedule, endTime: e.target.value})} />
          </Group>
          <Select label="Category" data={[{value:'Work',label:'Work'},{value:'Personal',label:'Personal'},{value:'Fitness',label:'Fitness'},{value:'Project',label:'Project'},{value:'Tennis',label:'Tennis'}]} value={editSchedule.category} onChange={(v) => setEditSchedule({...editSchedule, category: v})} />
          <TextInput label="Location" value={editSchedule.location || ''} onChange={(e) => setEditSchedule({...editSchedule, location: e.target.value})} />
          <Select label="Priority" data={[{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} value={editSchedule.priority} onChange={(v) => setEditSchedule({...editSchedule, priority: v})} />
          <Textarea label="Description" value={editSchedule.description || ''} onChange={(e) => setEditSchedule({...editSchedule, description: e.target.value})} />
          <SubtaskChecklist items={getSubtasksForSchedule(editSchedule.id)} {...subtaskHandlers(subtasks, editSchedule.id, setSubtasks)} />
          {editSchedule.seriesId && (
            <Radio.Group label="Apply changes to" value={editScope} onChange={setEditScope} description="Date, completion and subtasks stay per event">
              <Stack gap="xs" mt="xs">
                {SCOPE_OPTIONS.map((o) => <Radio key={o.value} value={o.value} label={o.label} />)}
              </Stack>
            </Radio.Group>
          )}
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setEditSchedule(null)}>Cancel</Button>
            <Button onClick={updateSchedule}>Save</Button>
          </Group>
        </Stack>}
      </Modal>
      {actions.deleteDialog}
    </Layout>
  );
}

export default SchedulesPage;
