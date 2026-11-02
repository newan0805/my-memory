// Recurring schedules are stored as ordinary schedules (one per occurrence) sharing a `seriesId`,
// so every occurrence works everywhere a schedule does: calendar, filters, completion, subtasks, backups.
import { getLocalDateStr } from './date';
import { newId, addDraftSubtasks, saveSubtasks } from './subtasks';

export const NO_REPEAT = { freq: 'none', days: [], end: 'count', count: 10, until: '' };
export const MAX_OCCURRENCES = 366;
const MAX_SPAN_DAYS = 3 * 366;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parse = (dateStr) => new Date(`${dateStr}T00:00:00`);

// Fields copied to other occurrences when editing "this and following" / "all".
const SHARED_FIELDS = ['title', 'startTime', 'endTime', 'category', 'location', 'priority', 'description'];

export const generateDates = (startStr, rule = NO_REPEAT) => {
  if (!startStr) return [];
  if (!rule || rule.freq === 'none') return [startStr];

  const start = parse(startStr);
  const startDay = start.getDate();
  const weekly = rule.days?.length ? rule.days : [start.getDay()];
  const maxCount = rule.end === 'count' ? Math.min(Math.max(1, Number(rule.count) || 1), MAX_OCCURRENCES) : MAX_OCCURRENCES;
  const until = rule.end === 'until' && rule.until ? parse(rule.until) : null;

  const matches = (d) => {
    switch (rule.freq) {
      case 'daily': return true;
      case 'weekdays': return d.getDay() >= 1 && d.getDay() <= 5;
      case 'weekly': return weekly.includes(d.getDay());
      // Months without that day (e.g. the 31st) are skipped rather than shifted.
      case 'monthly': return d.getDate() === startDay;
      default: return false;
    }
  };

  const dates = [];
  const cursor = new Date(start);
  for (let i = 0; i < MAX_SPAN_DAYS && dates.length < maxCount; i += 1) {
    if (until && cursor > until) break;
    if (matches(cursor)) dates.push(getLocalDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const describeRule = (rule) => {
  if (!rule || rule.freq === 'none') return 'Does not repeat';
  const what = {
    daily: 'Every day',
    weekdays: 'Every weekday',
    weekly: `Weekly on ${(rule.days?.length ? [...rule.days].sort() : []).map((d) => WEEKDAYS[d]).join(', ') || 'the same day'}`,
    monthly: 'Monthly on the same date',
  }[rule.freq];
  const ends = rule.end === 'until' && rule.until ? ` until ${rule.until}` : rule.end === 'count' ? `, ${rule.count} times` : '';
  return `${what}${ends}`;
};

const save = (schedules) => {
  localStorage.setItem('schedules', JSON.stringify(schedules));
  return schedules;
};

// Creates one schedule, or a whole series, plus a fresh copy of the draft subtasks for each occurrence.
export const createSchedules = ({ schedules, subtasks, base, rule, drafts = [] }) => {
  const dates = generateDates(base.date, rule);
  const seriesId = dates.length > 1 ? newId() : undefined;
  const created = dates.map((date) => ({
    ...base,
    id: newId(),
    date,
    completed: false,
    ...(seriesId ? { seriesId, recurrence: { ...rule } } : {}),
  }));
  let nextSubtasks = subtasks;
  created.forEach((schedule) => { nextSubtasks = addDraftSubtasks(nextSubtasks, schedule.id, drafts); });
  return { schedules: save([...schedules, ...created]), subtasks: nextSubtasks, count: created.length };
};

// Ids affected by an action on `schedule` with scope 'one' | 'following' | 'all'.
export const idsInScope = (schedules, schedule, scope) => {
  if (!schedule.seriesId || scope === 'one') return [schedule.id];
  return schedules
    .filter((s) => s.seriesId === schedule.seriesId && (scope === 'all' || s.date >= schedule.date))
    .map((s) => s.id);
};

export const deleteSchedules = ({ schedules, subtasks, ids }) => {
  const remove = new Set(ids);
  return {
    schedules: save(schedules.filter((s) => !remove.has(s.id))),
    subtasks: saveSubtasks(subtasks.filter((st) => !remove.has(st.scheduleId))),
  };
};

// Saves an edited occurrence; with a wider scope its shared fields are copied to the other occurrences.
// Dates and completion stay per occurrence.
export const updateSchedules = ({ schedules, edited, scope = 'one' }) => {
  const original = schedules.find((s) => s.id === edited.id) || edited;
  const targets = new Set(idsInScope(schedules, original, scope));
  const shared = Object.fromEntries(SHARED_FIELDS.map((key) => [key, edited[key]]));
  return save(schedules.map((s) => {
    if (s.id === edited.id) return edited;
    return targets.has(s.id) ? { ...s, ...shared } : s;
  }));
};

export const seriesSize = (schedules, schedule) => (schedule?.seriesId ? schedules.filter((s) => s.seriesId === schedule.seriesId).length : 1);
