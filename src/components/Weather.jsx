import React from 'react';
import { Group, Stack, Text, Loader, Tooltip } from '@mantine/core';
import { IconSun, IconMoon, IconCloud, IconCloudFog, IconCloudRain, IconSnowflake, IconCloudStorm, IconSunHigh, IconMapPin } from '@tabler/icons-react';
import { CONDITION_LABELS } from '../hooks/useWeather';

const getIcon = (condition, isDay) => {
  switch (condition) {
    case 'clear': return isDay ? IconSun : IconMoon;
    case 'partly': return isDay ? IconSunHigh : IconCloud;
    case 'cloudy': return IconCloud;
    case 'fog': return IconCloudFog;
    case 'rain': return IconCloudRain;
    case 'snow': return IconSnowflake;
    case 'storm': return IconCloudStorm;
    default: return IconCloud;
  }
};

const ICON_COLORS = { clear: '#facc15', partly: '#fbbf24', snow: '#e0f2fe', storm: '#a78bfa' };

// compact: single-line chip for the mobile header; otherwise a card for the sidebar.
function Weather({ weather, error, compact = false }) {
  if (!weather) {
    if (error) return compact ? null : <Text size="xs" c="dimmed">Weather unavailable</Text>;
    return <Loader size="xs" color="blue" />;
  }

  const Icon = getIcon(weather.condition, weather.isDay);
  const iconColor = ICON_COLORS[weather.condition] || '#cbd5e1';
  const label = CONDITION_LABELS[weather.condition];

  if (compact) {
    return (
      <Tooltip label={`${label} · ${weather.location}`}>
        <Group gap={4} wrap="nowrap">
          <Icon size={18} color={iconColor} />
          <Text size="sm" fw={600}>{weather.temperature}°</Text>
        </Group>
      </Tooltip>
    );
  }

  return (
    <Group
      gap="sm"
      p="sm"
      wrap="nowrap"
      style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
    >
      <Icon size={32} color={iconColor} />
      <Stack gap={0} style={{ overflow: 'hidden' }}>
        <Text size="lg" fw={700} lh={1.2}>{weather.temperature}°C</Text>
        <Text size="xs" c="#cbd5e1" truncate>{label}</Text>
        <Group gap={2} wrap="nowrap">
          <IconMapPin size={10} color="#94a3b8" />
          <Text size="xs" c="#94a3b8" truncate>{weather.location}</Text>
        </Group>
      </Stack>
    </Group>
  );
}

export default Weather;
