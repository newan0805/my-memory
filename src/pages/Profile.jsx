import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, TextInput, Select, Button, Stack, Group, Avatar, Divider } from '@mantine/core';
import { IconArrowLeft, IconUser, IconMail, IconMapPin } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IN', label: 'India' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'JP', label: 'Japan' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'SG', label: 'Singapore' },
  { value: 'OTHER', label: 'Other' },
];

function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(user);

  const handleSave = () => {
    const updatedUser = { ...formData };
    localStorage.setItem('userProfile', JSON.stringify(updatedUser));
    localStorage.setItem('userName', updatedUser.firstName);
    setUser(updatedUser);
    toast.success('Profile updated successfully');
  };

  return (
    <Layout user={user} petVisible={petVisible} setPetVisible={setPetVisible} weatherVisible={weatherVisible} setWeatherVisible={setWeatherVisible}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={1}><IconUser size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />Profile</Title>
            <Text c="dimmed">Manage your personal information</Text>
          </Stack>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Group>

        <Card withBorder padding="xl" radius="lg" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)', maxWidth: 600 }}>
          <Stack gap="lg">
            <Group>
              <Avatar size={80} radius="xl" style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }}>
                {formData.firstName?.[0]}{formData.lastName?.[0]}
              </Avatar>
              <Stack gap={4}>
                <Title order={3}>{formData.firstName} {formData.lastName}</Title>
                <Group gap="xs"><IconMail size={16} /><Text c="dimmed" size="sm">{formData.email || 'No email'}</Text></Group>
                <Group gap="xs"><IconMapPin size={16} /><Text c="dimmed" size="sm">{countries.find(c => c.value === formData.country)?.label || formData.country || 'No country'}</Text></Group>
              </Stack>
            </Group>

            <Divider />

            <Stack gap="md">
              <TextInput
                label="First Name"
                leftSection={<IconUser size={16} />}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <TextInput
                label="Last Name"
                leftSection={<IconUser size={16} />}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <TextInput
                label="Email"
                leftSection={<IconMail size={16} />}
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Select
                label="Country"
                leftSection={<IconMapPin size={16} />}
                data={countries}
                value={formData.country}
                onChange={(value) => setFormData({ ...formData, country: value })}
                searchable
              />
            </Stack>

            <Group justify="flex-end">
              <Button onClick={handleSave} variant="gradient" gradient={{ from: 'blue', to: 'violet' }}>Save Changes</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Layout>
  );
}

export default Profile;
