import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, NavLink, Group, Text, Avatar, Box, ActionIcon, Drawer, Badge } from '@mantine/core';
import { IconDashboard, IconCalendar, IconChecklist, IconClock, IconSettings, IconUser, IconMenu2, IconX, IconHeart, IconList } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [opened, setOpened] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/' },
    { icon: IconCalendar, label: 'Calendar', path: '/calendar' },
    { icon: IconChecklist, label: 'Todos', path: '/todos' },
    { icon: IconClock, label: 'Schedules', path: '/schedules' },
    { icon: IconList, label: 'Task Log', path: '/tasklog' },
    { icon: IconUser, label: 'Profile', path: '/profile' },
    { icon: IconSettings, label: 'Settings', path: '/settings' },
  ];

  const NavContent = () => (
    <>
      <Group mb="lg" p="xs" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: 12 }}>
        <Avatar style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }} radius="xl" size={isMobile ? 'md' : 'md'}>{user?.firstName?.[0]}</Avatar>
        <Box style={{ overflow: 'hidden', flex: 1 }}>
          <Text size="sm" fw={600} truncate>{user?.firstName} {user?.lastName}</Text>
          <Text size="xs" c="#94a3b8" truncate>{user?.email || user?.country || 'User'}</Text>
        </Box>
      </Group>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          label={item.label}
          leftSection={<item.icon size={18} />}
          active={location.pathname === item.path}
          onClick={() => { navigate(item.path); if (isMobile) setOpened(false); }}
          mb="xs"
          style={{ borderRadius: 10 }}
          color="blue"
          variant={location.pathname === item.path ? 'filled' : 'subtle'}
        />
      ))}
    </>
  );

  return (
    <AppShell
      navbar={isMobile ? undefined : { width: collapsed ? 80 : 280, breakpoint: 'md' }}
      padding={isMobile ? 'sm' : 'md'}
      style={{ background: 'transparent', minHeight: '100vh' }}
    >
      {!isMobile && (
        <AppShell.Navbar p={collapsed ? 'xs' : 'md'} style={{ background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease' }}>
          <Group mb="xl" p="xs" justify={collapsed ? 'center' : 'flex-start'} style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: 12 }}>
            <Avatar style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }} radius="xl">{user?.firstName?.[0]}</Avatar>
            {!collapsed && (
              <Box style={{ overflow: 'hidden' }}>
                <Text size="sm" fw={600} truncate>{user?.firstName} {user?.lastName}</Text>
                <Text size="xs" c="#94a3b8" truncate>{user?.email || user?.country || 'User'}</Text>
              </Box>
            )}
          </Group>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={<item.icon size={18} />}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              mb="xs"
              style={{ borderRadius: 10 }}
              color="blue"
              variant={location.pathname === item.path ? 'filled' : 'subtle'}
            />
          ))}
        </AppShell.Navbar>
        )}

        <Drawer
          opened={isMobile && opened}
          onClose={() => setOpened(false)}
          size={isMobile ? 260 : (collapsed ? 80 : 280)}
          padding="md"
          hiddenFrom="md"
          styles={{
            content: {
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            header: { background: 'transparent' },
          }}
        >
          <NavContent />
        </Drawer>

        <AppShell.Main style={{ background: 'transparent', padding: isMobile ? '8px' : undefined, minHeight: '100vh' }}>
          {isMobile && (
            <Group mb="md" p="xs" style={{ background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', borderRadius: 12, border: `1px solid rgba(255,255,255,0.1)` }}>
              <ActionIcon onClick={() => setOpened(true)} variant="subtle" size="lg">
                <IconMenu2 size={20} />
              </ActionIcon>
              <Text fw={600} style={{ flex: 1, color: '#0f172a' }}>My Memory</Text>
              <Avatar size="sm" style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }}>{user?.firstName?.[0]}</Avatar>
            </Group>
          )}
          {children}
        </AppShell.Main>
      </AppShell>
  );
}

export default Layout;
