import React, { useState } from 'react';
import { Group, SegmentedControl, Select, TextInput, ActionIcon, Tooltip } from '@mantine/core';
import { IconSortAscending, IconSortDescending, IconCalendarEvent } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { getLocalDateStr } from '../utils/date';

const STORAGE_KEY = 'dateFilters';

const PRESET_LABELS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'Next 7 days',
  pastWeek: 'Last 7 days',
  date: 'Pick date',
  all: 'All',
};

// Planning pages look ahead; history pages pass e.g. ['today', 'pastWeek', 'date', 'all'].
const DEFAULT_PRESETS = ['today', 'tomorrow', 'week', 'date', 'all'];

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateStr(d);
};

// Inclusive YYYY-MM-DD range for a filter; null bounds mean "unbounded".
export const getDateRange = ({ preset, date }) => {
  switch (preset) {
    case 'today': return { from: addDays(0), to: addDays(0) };
    case 'tomorrow': return { from: addDays(1), to: addDays(1) };
    case 'week': return { from: addDays(0), to: addDays(6) };
    case 'pastWeek': return { from: addDays(-6), to: addDays(0) };
    case 'date': return { from: date || addDays(0), to: date || addDays(0) };
    default: return { from: null, to: null };
  }
};

export const isInRange = (dateStr, { from, to }) => {
  if (!from && !to) return true;
  if (!dateStr) return false;
  return (!from || dateStr >= from) && (!to || dateStr <= to);
};

// Sorts by date then time; `getDate`/`getTime` read the fields from each item.
export const sortByDate = (items, sort, getDate, getTime = () => '') => [...items].sort((a, b) => {
  const cmp = (getDate(a) || '').localeCompare(getDate(b) || '') || (getTime(a) || '').localeCompare(getTime(b) || '');
  return sort === 'desc' ? -cmp : cmp;
});

const readSaved = (key) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[key];
  } catch {
    return undefined;
  }
};

// Filter state per page, remembered across visits.
export const useDateFilter = (pageKey, defaults = { preset: 'today', sort: 'asc' }) => {
  const [filter, setFilterState] = useState(() => ({ date: getLocalDateStr(), ...defaults, ...readSaved(pageKey) }));
  const setFilter = (next) => {
    setFilterState(next);
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [pageKey]: next }));
    } catch {
      // Not remembering the filter is fine.
    }
  };
  return [filter, setFilter];
};

function DateFilter({ value, onChange, presets = DEFAULT_PRESETS }) {
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const options = presets.map((p) => ({ value: p, label: PRESET_LABELS[p] }));
  const update = (changes) => onChange({ ...value, ...changes });

  return (
    <Group gap="xs" wrap="wrap" align="center">
      {isMobile ? (
        <Select
          data={options}
          value={value.preset}
          onChange={(preset) => preset && update({ preset })}
          allowDeselect={false}
          leftSection={<IconCalendarEvent size={16} />}
          style={{ flex: 1, minWidth: 140 }}
          aria-label="Date range"
        />
      ) : (
        <SegmentedControl data={options} value={value.preset} onChange={(preset) => update({ preset })} />
      )}
      {value.preset === 'date' && (
        <TextInput
          type="date"
          value={value.date || ''}
          onChange={(e) => update({ date: e.currentTarget.value })}
          style={{ flex: isMobile ? 1 : undefined, minWidth: 150 }}
          aria-label="Date"
        />
      )}
      <Tooltip label={value.sort === 'desc' ? 'Latest first' : 'Earliest first'}>
        <ActionIcon
          variant="light"
          size="lg"
          onClick={() => update({ sort: value.sort === 'desc' ? 'asc' : 'desc' })}
          aria-label={value.sort === 'desc' ? 'Sorted latest first' : 'Sorted earliest first'}
        >
          {value.sort === 'desc' ? <IconSortDescending size={18} /> : <IconSortAscending size={18} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export default DateFilter;
