import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, Button, Stack, Group, Switch, Divider, Alert, SimpleGrid, UnstyledButton, TextInput, Box } from '@mantine/core';
import { IconArrowLeft, IconTrash, IconAlertTriangle, IconSettings, IconDatabase, IconPalette, IconDeviceFloppy, IconCloudUpload } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { PETS, PetSvg, parseEmoji } from '../components/Pet';
import usePreferences from '../hooks/usePreferences';
import BackupRestore from '../components/BackupRestore';
import { clearAllData } from '../utils/storage';

function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [preferences, updatePreferences] = usePreferences();
  const [petName, setPetName] = useState(preferences.petName);

  const [petEmoji, setPetEmoji] = useState(preferences.customPetEmoji);

  useEffect(() => setPetName(preferences.petName), [preferences.petName]);
  useEffect(() => setPetEmoji(preferences.customPetEmoji), [preferences.customPetEmoji]);

  const savePetEmoji = () => {
    const emoji = parseEmoji(petEmoji);
    if (!emoji) {
      toast.error('Please enter an emoji (use your keyboard\'s emoji picker)');
      return;
    }
    setPetEmoji(emoji);
    updatePreferences({ customPetEmoji: emoji, petId: 'emoji' });
    toast.success(`Your pet is now ${emoji}`);
  };

  const savePetName = () => {
    updatePreferences({ petName: petName.trim() });
    toast.success(petName.trim() ? `Your pet is now called ${petName.trim()}` : 'Pet name cleared');
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all your data? This will delete all schedules, todos, and settings. This action cannot be undone.')) {
      await clearAllData();
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
          <Button variant="subtle" visibleFrom="sm" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back to Dashboard</Button>
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
                <IconPalette size={20} color="var(--mantine-color-violet-5)" />
                <Title order={3}>Appearance</Title>
              </Group>
              <Text size="sm" c="dimmed">Background, weather and companion</Text>
            </Stack>

            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2}>
                <Text fw={500}>Time-based background</Text>
                <Text size="sm" c="dimmed">Sky changes with the time of day and the weather</Text>
              </Stack>
              <Switch checked={preferences.timeBackground} onChange={(e) => updatePreferences({ timeBackground: e.currentTarget.checked })} />
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2}>
                <Text fw={500}>Weather widget</Text>
                <Text size="sm" c="dimmed">Uses the city and country from your Profile</Text>
              </Stack>
              <Switch checked={preferences.weatherVisible} onChange={(e) => updatePreferences({ weatherVisible: e.currentTarget.checked })} />
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2}>
                <Text fw={500}>Show pet</Text>
                <Text size="sm" c="dimmed">A little companion — click it, or drag it around</Text>
              </Stack>
              <Switch checked={preferences.petVisible} onChange={(e) => updatePreferences({ petVisible: e.currentTarget.checked })} />
            </Group>

            {preferences.petVisible && (
              <Stack gap="sm">
                <SimpleGrid cols={{ base: 3, xs: 5 }} spacing="sm">
                  {PETS.map((pet) => {
                    const selected = preferences.petId === pet.value;
                    return (
                      <UnstyledButton
                        key={pet.value}
                        onClick={() => updatePreferences({ petId: pet.value })}
                        aria-pressed={selected}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          textAlign: 'center',
                          background: selected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.4)',
                          border: `2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Box w={48} h={48} mx="auto" mb={6}><PetSvg petId={pet.value} emoji={preferences.customPetEmoji} /></Box>
                        <Text size="sm" fw={selected ? 700 : 500}>{pet.label}</Text>
                      </UnstyledButton>
                    );
                  })}
                </SimpleGrid>
                {preferences.petId === 'emoji' && (
                  <Group align="flex-end" wrap="nowrap">
                    <TextInput
                      label="Pet emoji"
                      description="Type or paste any emoji from your keyboard"
                      placeholder="🐢"
                      value={petEmoji}
                      onChange={(e) => setPetEmoji(e.currentTarget.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') savePetEmoji(); }}
                      styles={{ input: { fontSize: 22 } }}
                      style={{ flex: 1 }}
                    />
                    <Button leftSection={<IconDeviceFloppy size={16} />} onClick={savePetEmoji} disabled={petEmoji === preferences.customPetEmoji}>
                      Save
                    </Button>
                  </Group>
                )}
                <Group align="flex-end" wrap="nowrap">
                  <TextInput
                    label="Pet name"
                    placeholder="Give your pet a name"
                    value={petName}
                    maxLength={24}
                    onChange={(e) => setPetName(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') savePetName(); }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={savePetName}
                    disabled={petName.trim() === preferences.petName}
                  >
                    Save
                  </Button>
                </Group>
              </Stack>
            )}

            <Divider />

            <Stack gap="xs">
              <Group gap="xs">
                <IconCloudUpload size={20} color="var(--mantine-color-blue-5)" />
                <Title order={3}>Backup &amp; Restore</Title>
              </Group>
              <Text size="sm" c="dimmed">Export all your data to a file, or import it on a new device</Text>
            </Stack>

            <BackupRestore />

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
