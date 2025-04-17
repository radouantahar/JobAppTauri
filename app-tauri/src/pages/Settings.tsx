// pages/Settings.tsx
import { useState, useEffect } from 'react';
import { Container, Tabs, Card, Stack, Title, TextInput, Button, Checkbox, Select } from '@mantine/core';
import { IconSettings, IconDatabase, IconApi } from '@tabler/icons-react';
import { llmService } from '../services/api';
import { useAppStore } from '../store';

interface LLMProvider {
  id: string; // Changed from number to string
  name: string;
  // Add other provider properties if they exist
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'llm' | 'database'>('general');
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([]);
  const { isDarkMode, toggleDarkMode, setLoading } = useAppStore();

  useEffect(() => {
    loadLlmProviders();
  }, []);

  const loadLlmProviders = async () => {
    setLoading(true);
    try {
      const providers = await llmService.getLLMProviders();
      // Convert IDs to strings if they come as numbers from the API
      setLlmProviders(providers.map(p => ({
        ...p,
        id: p.id.toString()
      })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as any)}>
        <Tabs.List>
          <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>
            General
          </Tabs.Tab>
          <Tabs.Tab value="llm" leftSection={<IconApi size={16} />}>
            AI Settings
          </Tabs.Tab>
          <Tabs.Tab value="database" leftSection={<IconDatabase size={16} />}>
            Database
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="xl">
          <Card withBorder>
            <Stack gap="md">
              <Title order={3}>Appearance</Title>
              <Checkbox
                label="Dark Mode"
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              
              <Title order={3} mt="md">Primary Home</Title>
              <TextInput
                label="Address"
                placeholder="Enter your primary address"
              />
              
              <Title order={3} mt="md">Secondary Home</Title>
              <TextInput
                label="Address"
                placeholder="Enter your secondary address"
              />
              
              <Button mt="md" style={{ alignSelf: 'flex-end' }}>
                Save Settings
              </Button>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="llm" pt="xl">
          <Card withBorder>
            <Stack gap="md">
              <Title order={3}>AI Provider Settings</Title>
              <Select
                label="Default Provider"
                placeholder="Select provider"
                data={llmProviders.map(p => ({ 
                  value: p.id, 
                  label: p.name 
                }))}
              />
              
              <Title order={3} mt="md">API Keys</Title>
              {llmProviders.map(provider => (
                <TextInput
                  key={provider.id}
                  label={`${provider.name} API Key`}
                  placeholder={`Enter your ${provider.name} API key`}
                />
              ))}
              
              <Button mt="md" style={{ alignSelf: 'flex-end' }}>
                Save AI Settings
              </Button>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="database" pt="xl">
          <Card withBorder>
            <Stack gap="md">
              <Title order={3}>Database Settings</Title>
              <TextInput
                label="NocoDB URL"
                placeholder="http://localhost:8080"
              />
              <TextInput
                label="API Token"
                placeholder="Enter your NocoDB API token"
              />
              
              <Button mt="md" color="blue" style={{ alignSelf: 'flex-end' }}>
                Test Connection
              </Button>
              
              <Button mt="md" color="red" style={{ alignSelf: 'flex-end' }}>
                Reset Database
              </Button>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

export default SettingsPage;