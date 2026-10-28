import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, Button, Stack, Group, Switch, Divider, Alert } from '@mantine/core';
import { IconArrowLeft, IconTrash, IconAlertTriangle, IconSettings, IconDatabase } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

function Settings({ user, setUser }) {
  const navigate = useNavigate();

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all your data? This will delete all schedules, todos, and settings. This action cannot be undone.')) {
      localStorage.removeItem('schedules');
      localStorage.removeItem('todos');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userName');
      setUser(null);
      toast.success('All data cleared');
      navigate('/onboarding');
    }
  };

  return (
    <Layout user={user}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}><IconSettings size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />Settings</Title>
            <Text c="dimmed">Customize your app experience</Text>
          </Stack>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Group>

        <Card withBorder padding="xl" radius="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)', maxWidth: 600 }}>
          <Stack gap="lg">
            <Stack gap="xs">
              <Group gap="xs">
                <IconSettings size={20} />
                <Title order={3}>General</Title>
              </Group>
              <Text size="sm" c="dimmed">App preferences</Text>
            </Stack>

            <Divider />

            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={500}>Dark Mode</Text>
                <Text size="sm" c="dimmed">Use dark theme</Text>
              </Stack>
              <Switch defaultChecked disabled />
            </Group>

            <Divider />

            <Stack gap="xs">
              <Group gap="xs">
                <IconDatabase size={20} color="var(--mantine-color-orange-6)" />
                <Title order={3} c="orange">Data Management</Title>
              </Group>
              <Text size="sm" c="dimmed">Manage your stored data</Text>
            </Stack>

            <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
              You can clear all your data from this device. Make sure you don't need it.
            </Alert>

            <Divider />

            <Stack gap="xs">
              <Group gap="xs">
                <IconTrash size={20} color="var(--mantine-color-red-6)" />
                <Title order={3} c="red">Danger Zone</Title>
              </Group>
              <Text size="sm" c="dimmed">Irreversible actions</Text>
            </Stack>

            <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
              Clearing all data will permanently delete your schedules, todos, profile, and all settings.
            </Alert>

            <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={handleClearAllData}>
              Clear All Data
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Layout>
  );
}

export default Settings;
