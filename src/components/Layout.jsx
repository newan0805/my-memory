import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, NavLink, Group, Text, Avatar, Box, ActionIcon, Burger, Tooltip, Stack } from '@mantine/core';
import { IconDashboard, IconCalendar, IconChecklist, IconClock, IconSettings, IconUser, IconList, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import Pet from './Pet';
import Weather from './Weather';
import TimeBackground, { getPhase } from './TimeBackground';
import usePreferences from '../hooks/usePreferences';
import useWeather from '../hooks/useWeather';

const navItems = [
  { icon: IconDashboard, label: 'Dashboard', path: '/' },
  { icon: IconCalendar, label: 'Calendar', path: '/calendar' },
  { icon: IconChecklist, label: 'Todos', path: '/todos' },
  { icon: IconClock, label: 'Schedules', path: '/schedules' },
  { icon: IconList, label: 'Task Log', path: '/tasklog' },
  { icon: IconUser, label: 'Profile', path: '/profile' },
  { icon: IconSettings, label: 'Settings', path: '/settings' },
];

const avatarStyle = { background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' };
const glass = { background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)' };

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Matches Mantine's "sm" breakpoint (48em) used by the AppShell below.
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [opened, setOpened] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [preferences] = usePreferences();
  const { weather, error: weatherError } = useWeather(user?.city, user?.country, preferences.weatherVisible || preferences.timeBackground);

  const isCollapsed = collapsed && !isMobile;
  const currentPage = navItems.find((item) => item.path === location.pathname);

  useEffect(() => {
    document.title = currentPage ? `${currentPage.label} · My Memory` : 'My Memory';
  }, [currentPage]);
  const phase = getPhase(new Date().getHours());

  const toggleCollapsed = () => {
    localStorage.setItem('sidebarCollapsed', String(!collapsed));
    setCollapsed(!collapsed);
  };

  const go = (path) => {
    navigate(path);
    setOpened(false);
  };

  return (
    <TimeBackground enabled={preferences.timeBackground} condition={weather?.condition}>
      <AppShell
        header={isMobile ? { height: 56 } : undefined}
        navbar={{ width: isCollapsed ? 80 : 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
        style={{ minHeight: '100vh' }}
        styles={{ root: { background: 'transparent' }, main: { background: 'transparent' } }}
      >
        {isMobile && (
          <AppShell.Header px="sm" style={{ ...glass, borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <Burger opened={opened} onClick={() => setOpened((o) => !o)} size="sm" aria-label="Toggle navigation" />
                <Text fw={700} c="white">My Memory</Text>
              </Group>
              <Group gap="sm" wrap="nowrap">
                {preferences.weatherVisible && <Weather weather={weather} error={weatherError} compact />}
                <Avatar size="sm" style={avatarStyle}>{user?.firstName?.[0]}</Avatar>
              </Group>
            </Group>
          </AppShell.Header>
        )}

        <AppShell.Navbar p={isCollapsed ? 'xs' : 'md'} style={{ ...glass, borderRight: '1px solid rgba(139, 92, 246, 0.4)', transition: 'width 0.2s ease' }}>
          <AppShell.Section>
            <Group mb="lg" p="xs" justify={isCollapsed ? 'center' : 'flex-start'} wrap="nowrap" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: 12 }}>
              <Avatar style={avatarStyle} radius="xl">{user?.firstName?.[0]}</Avatar>
              {!isCollapsed && (
                <Box style={{ overflow: 'hidden' }}>
                  <Text size="sm" fw={600} truncate>{user?.firstName} {user?.lastName}</Text>
                  <Text size="xs" c="#94a3b8" truncate>{user?.email || user?.country || 'User'}</Text>
                </Box>
              )}
            </Group>
          </AppShell.Section>

          <AppShell.Section grow style={{ overflowY: 'auto' }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const link = (
                <NavLink
                  key={item.path}
                  label={isCollapsed ? null : item.label}
                  leftSection={<item.icon size={20} />}
                  active={active}
                  onClick={() => go(item.path)}
                  mb="xs"
                  style={{ borderRadius: 10, justifyContent: isCollapsed ? 'center' : undefined }}
                  styles={isCollapsed ? { section: { marginInlineEnd: 0 } } : undefined}
                  color="blue"
                  variant={active ? 'filled' : 'subtle'}
                  aria-label={item.label}
                />
              );
              return isCollapsed ? <Tooltip key={item.path} label={item.label} position="right">{link}</Tooltip> : link;
            })}
          </AppShell.Section>

          <AppShell.Section>
            <Stack gap="sm">
              {preferences.weatherVisible && !isCollapsed && !isMobile && <Weather weather={weather} error={weatherError} />}
              {!isMobile && (
                <Group justify={isCollapsed ? 'center' : 'flex-end'}>
                  <ActionIcon onClick={toggleCollapsed} variant="subtle" size="lg" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
                  </ActionIcon>
                </Group>
              )}
            </Stack>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>

      {preferences.petVisible && (
        <Pet petId={preferences.petId} petName={preferences.petName} size={isMobile ? 40 : 52} phase={phase} />
      )}
    </TimeBackground>
  );
}

export default Layout;
