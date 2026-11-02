import React, { useMemo } from 'react';
import { Stack, Group, Select, Chip, NumberInput, TextInput, SegmentedControl, Text } from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import { WEEKDAYS, generateDates, MAX_OCCURRENCES } from '../utils/recurrence';

const FREQUENCIES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly', label: 'Weekly on…' },
  { value: 'monthly', label: 'Monthly (same date)' },
];

// Repeat settings for the "Add schedule" forms, with a live count of what will be created.
function RecurrenceFields({ value, onChange, startDate }) {
  const update = (changes) => onChange({ ...value, ...changes });
  const dates = useMemo(() => generateDates(startDate, value), [startDate, value]);
  const repeating = value.freq !== 'none';

  return (
    <Stack gap="xs">
      <Select
        label="Repeat"
        leftSection={<IconRepeat size={16} />}
        data={FREQUENCIES}
        value={value.freq}
        allowDeselect={false}
        onChange={(freq) => {
          if (!freq) return;
          // Weekly defaults to the start date's weekday.
          const days = freq === 'weekly' && !value.days.length && startDate ? [new Date(`${startDate}T00:00:00`).getDay()] : value.days;
          update({ freq, days });
        }}
      />

      {value.freq === 'weekly' && (
        <Chip.Group multiple value={value.days.map(String)} onChange={(days) => update({ days: days.map(Number) })}>
          <Group gap={6}>
            {WEEKDAYS.map((day, i) => <Chip key={day} value={String(i)} size="xs">{day}</Chip>)}
          </Group>
        </Chip.Group>
      )}

      {repeating && (
        <>
          <SegmentedControl
            size="xs"
            value={value.end}
            onChange={(end) => update({ end })}
            data={[{ value: 'count', label: 'Ends after' }, { value: 'until', label: 'Ends on date' }]}
          />
          {value.end === 'count' ? (
            <NumberInput
              min={2}
              max={MAX_OCCURRENCES}
              value={value.count}
              onChange={(count) => update({ count: Number(count) || 2 })}
              rightSection={<Text size="xs" c="dimmed" pr="sm">times</Text>}
              rightSectionWidth={60}
              aria-label="Number of occurrences"
            />
          ) : (
            <TextInput type="date" min={startDate} value={value.until} onChange={(e) => update({ until: e.currentTarget.value })} aria-label="Repeat until" />
          )}
          <Text size="xs" c={dates.length > 1 ? 'dimmed' : 'orange'}>
            {dates.length > 1
              ? `Creates ${dates.length} schedules: ${dates[0]} → ${dates[dates.length - 1]}`
              : dates.length === 1 ? 'Only one date matches — pick more days or a later end date.' : 'No dates match these settings.'}
          </Text>
        </>
      )}
    </Stack>
  );
}

export default RecurrenceFields;
