import { useState, useEffect } from 'react';
import { Container, TextInput, Textarea, Button, Group, Card, Avatar, Title, Stack } from '@mantine/core';
import { IconUser, IconMail, IconDeviceFloppy } from '@tabler/icons-react';
import { userService } from '../services/api';
import { useAppStore } from '../store';
import type { UserProfile, CVInfo } from '../types';

// Define complete default CV info with all required fields
const defaultCVInfo: Required<CVInfo> = {
  path: '',
  lastUpdated: new Date().toISOString(),
  skills: [],
  experienceYears: 0,
  education: [],
  certifications: []
};

const defaultLocations = {
  primary: '',
  secondary: undefined,
  coordinates: undefined
};

interface ProfileState extends Omit<Partial<UserProfile>, 'cv'> {
  cv: Required<CVInfo>;
  locations: {
    primary: string;
    secondary?: string;
    coordinates?: {
      primary: any; // Replace with your actual Coordinates type
      secondary?: any;
    };
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState>({
    name: '',
    email: '',
    locations: { ...defaultLocations },
    cv: { ...defaultCVInfo }
  });
  const { setLoading } = useAppStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile();
      setProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        locations: {
          primary: userProfile.locations?.primary || defaultLocations.primary,
          secondary: userProfile.locations?.secondary,
          coordinates: userProfile.locations?.coordinates
        },
        cv: {
          path: userProfile.cv?.path || defaultCVInfo.path,
          lastUpdated: userProfile.cv?.lastUpdated || defaultCVInfo.lastUpdated,
          skills: userProfile.cv?.skills ? [...userProfile.cv.skills] : [...defaultCVInfo.skills],
          experienceYears: userProfile.cv?.experienceYears ?? defaultCVInfo.experienceYears,
          education: userProfile.cv?.education ? [...userProfile.cv.education] : [...defaultCVInfo.education],
          certifications: userProfile.cv?.certifications ? [...userProfile.cv.certifications] : [...defaultCVInfo.certifications]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userService.updateUserProfile({
        ...profile,
        locations: {
          primary: profile.locations.primary,
          secondary: profile.locations.secondary,
          coordinates: profile.locations.coordinates
        },
        cv: {
          ...profile.cv
        }
      } as UserProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Card withBorder shadow="sm" p="xl">
        <Stack gap="xl">
          <Title order={2}>Your Profile</Title>
          
          <Group>
            <Avatar size="xl" radius="xl" />
            <Stack gap={0}>
              <TextInput
                label="Full Name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.currentTarget.value})}
                leftSection={<IconUser size={16} />}
                style={{ width: 300 }}
              />
              <TextInput
                label="Email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.currentTarget.value})}
                leftSection={<IconMail size={16} />}
                style={{ width: 300 }}
                mt="sm"
              />
            </Stack>
          </Group>

          <TextInput
            label="Primary Location"
            value={profile.locations.primary}
            onChange={(e) => setProfile({
              ...profile, 
              locations: {
                ...profile.locations,
                primary: e.currentTarget.value
              }
            })}
          />

          <TextInput
            label="Secondary Location (Optional)"
            value={profile.locations.secondary || ''}
            onChange={(e) => setProfile({
              ...profile, 
              locations: {
                ...profile.locations,
                secondary: e.currentTarget.value || undefined
              }
            })}
          />

          <Textarea
            label="Skills (comma separated)"
            value={profile.cv.skills.join(', ')}
            onChange={(e) => setProfile({
              ...profile,
              cv: {
                ...profile.cv,
                skills: e.currentTarget.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
              }
            })}
            autosize
            minRows={3}
          />

          <TextInput
            label="Years of Experience"
            type="number"
            value={profile.cv.experienceYears.toString()}
            onChange={(e) => setProfile({
              ...profile,
              cv: {
                ...profile.cv,
                experienceYears: parseInt(e.currentTarget.value) || 0
              }
            })}
          />

          <Group justify="flex-end" mt="md">
            <Button 
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
            >
              Save Profile
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}