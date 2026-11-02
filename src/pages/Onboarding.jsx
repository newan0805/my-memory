import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Title, Text, TextInput, Select, Button, Stack, Stepper, Group, Avatar } from '@mantine/core';
import { IconUser, IconMapPin, IconCheck, IconMail, IconBuildingCommunity } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useMediaQuery } from '@mantine/hooks';
import BackupRestore from '../components/BackupRestore';

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

function Onboarding({ onComplete }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const isMobile = useMediaQuery('(max-width: 48em)');

  useEffect(() => {
    document.title = 'Welcome · My Memory';
  }, []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    city: '',
  });

  const handleNext = () => {
    if (active === 0) {
      if (!formData.firstName) {
        toast.error('Please enter your first name');
        return;
      }
    }
    if (active === 1) {
      if (!formData.country) {
        toast.error('Please select your country');
        return;
      }
    }
    if (active < 2) {
      setActive(active + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const userProfile = {
      ...formData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('userName', formData.firstName);
    onComplete(userProfile);
    toast.success('Welcome to My Memory!');
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%)' }}>
      <Container size="sm" py={{ base: 'xl', sm: 80 }} px="md">
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <Title order={1} style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome to My Memory</Title>
            <Text c="dimmed">Your personal command center for the day</Text>
          </Stack>

          <Card withBorder padding={isMobile ? 'md' : 'xl'} radius="lg" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Stepper active={active} onStepClick={setActive} mb="xl" color="blue" size={isMobile ? 'xs' : 'sm'} allowNextStepsSelect={false}>
              <Stepper.Step label={isMobile ? null : 'Personal Info'} description={isMobile ? null : 'Tell us about you'} icon={<IconUser size={18} />} />
              <Stepper.Step label={isMobile ? null : 'Location'} description={isMobile ? null : 'Where are you from'} icon={<IconMapPin size={18} />} />
              <Stepper.Step label={isMobile ? null : 'Complete'} description={isMobile ? null : 'All set'} icon={<IconCheck size={18} />} />
            </Stepper>

            {active === 0 && (
              <Stack gap="md">
                <TextInput
                  label="First Name"
                  placeholder="Enter your first name"
                  required
                  leftSection={<IconUser size={16} />}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Enter your last name"
                  leftSection={<IconUser size={16} />}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                <TextInput
                  label="Email"
                  placeholder="your.email@example.com"
                  type="email"
                  leftSection={<IconMail size={16} />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Stack>
            )}

            {active === 1 && (
              <Stack gap="md">
                <Select
                  label="Country"
                  placeholder="Select your country"
                  required
                  leftSection={<IconMapPin size={16} />}
                  data={countries}
                  value={formData.country}
                  onChange={(value) => setFormData({ ...formData, country: value })}
                  searchable
                />
                <TextInput
                  label="City"
                  placeholder="e.g. Colombo"
                  description="Used for your local weather"
                  leftSection={<IconBuildingCommunity size={16} />}
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Stack>
            )}

            {active === 2 && (
              <Stack gap="md" align="center" py="xl">
                <Avatar size={80} radius="xl" style={{ background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' }}>
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </Avatar>
                <Title order={3}>All Set!</Title>
                <Text c="dimmed" ta="center">
                  Welcome aboard, {formData.firstName}! Your personal dashboard is ready.
                </Text>
              </Stack>
            )}

            <Group justify="space-between" mt="xl">
              <Button variant="subtle" onClick={() => setActive(active - 1)} disabled={active === 0}>
                Back
              </Button>
              <Button onClick={handleNext} variant="gradient" gradient={{ from: 'blue', to: 'violet' }}>
                {active === 2 ? 'Get Started' : 'Next'}
              </Button>
            </Group>
          </Card>

          <Stack gap={4} align="center">
            <Text size="sm" c="dimmed">Reinstalled the app or switching devices?</Text>
            <BackupRestore compact />
          </Stack>
        </Stack>
      </Container>
    </div>
  );
}

export default Onboarding;
