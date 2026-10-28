import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, NavLink, Group, Text, Avatar, Box, ActionIcon } from '@mantine/core';
import { IconDashboard, IconCalendar, IconChecklist, IconClock, IconSettings, IconUser, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [collapsed, setCollapsed] = useState(isMobile);

  const navItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/' },
    { icon: IconCalendar, label: 'Calendar', path: '/calendar' },
    { icon: IconChecklist, label: 'Todos', path: '/todos' },
    { icon: IconClock, label: 'Schedules', path: '/schedules' },
    { icon: IconUser, label: 'Profile', path: '/profile' },
    { icon: IconSettings, label: 'Settings', path: '/settings' },
  ];

  const width = isMobile ? (collapsed ? 0 : 280) : (collapsed ? 80 : 280);

  return (
    <AppShell
      navbar={{ width, breakpoint: 'md' }}
      padding="md"
      style={{ background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%)', minHeight: '100vh' }}
    >
      {!isMobile || !collapsed ? (
        <AppShell.Navbar p={collapsed && !isMobile ? 'xs' : 'md'} style={{ background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease', overflow: 'hidden' }}>
          <Group mb="xl" p="xs" justify={collapsed && !isMobile ? 'center' : 'flex-start'} style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: 12 }}>
            <Avatar style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }} radius="xl">{user?.firstName?.[0]}</Avatar>
            {!(collapsed && !isMobile) && (
              <Box style={{ overflow: 'hidden' }}>
                <Text size="sm" fw={600} truncate>{user?.firstName} {user?.lastName}</Text>
                <Text size="xs" c="dimmed" truncate>{user?.email || user?.country || 'User'}</Text>
              </Box>
            )}
          </Group>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              label={(collapsed && !isMobile) ? '' : item.label}
              leftSection={<item.icon size={18} />}
              active={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (isMobile) setCollapsed(true); }}
              mb="xs"
              style={{ borderRadius: 10, justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start' }}
              color="blue"
              variant={location.pathname === item.path ? 'filled' : 'subtle'}
              title={(collapsed && !isMobile) ? item.label : ''}
            />
          ))}
          {!isMobile && (
            <Group justify="center" mt="auto">
              <ActionIcon onClick={() => setCollapsed(!collapsed)} variant="subtle" size="lg">
                {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
              </ActionIcon>
            </Group>
          )}
        </AppShell.Navbar>
      ) : null}
      <AppShell.Main style={{ background: 'transparent', paddingLeft: isMobile && collapsed ? 0 : undefined }}>
        {isMobile && (
          <Group mb="md">
            <ActionIcon onClick={() => setCollapsed(!collapsed)} variant="light" size="lg">
              <IconChevronRight size={18} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
            </ActionIcon>
            <Text fw={600}>Menu</Text>
          </Group>
        )}
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;
