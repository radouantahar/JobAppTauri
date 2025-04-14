// pages/Search.tsx
import { useState, useEffect } from 'react';
import { Container, Grid, TextInput, Button, Group, MultiSelect, Select, Checkbox, Text } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { JobCard } from '../components/JobCard';
import { jobService } from '../services/api';
import { useAppStore } from '../store';
import type { Job, JobType } from '../types';

const JOB_TYPE_DISPLAY_MAP: Record<JobType, string> = {
  'full-time': 'CDI',
  'part-time': 'Alternance',
  'contract': 'Freelance/CDD',
  'internship': 'Stage',
  'temporary': 'Temporaire'
};

export function SearchPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLoading } = useAppStore();

  // Load initial jobs with preferences
  useEffect(() => {
    loadInitialJobs();
  }, []);

  const loadInitialJobs = async () => {
    setLoading(true);
    setIsLoading(true);
    setError(null);
    try {
      // Get search preferences and generate default search criteria
      const results = await jobService.searchJobs({
        keywords: [], // Will use preferences from backend
        location: '',
        datePosted: 'month'
      });
      setJobs(results);
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() && locations.length === 0 && !selectedJobType && !isRemote) {
      // If no filters are set, reload with preferences
      return loadInitialJobs();
    }

    setLoading(true);
    setIsLoading(true);
    setError(null);
    try {
      const results = await jobService.searchJobs({
        keywords: [searchTerm],
        location: locations.join(', '),
        jobType: selectedJobType ? [selectedJobType] : undefined,
        remoteOnly: isRemote,
        datePosted: 'month'
      });
      setJobs(results);
    } catch (err) {
      setError('Failed to search jobs');
      console.error('Error searching jobs:', err);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Grid gutter="md">
        <Grid.Col span={12}>
          <Group gap="sm" align="flex-end">
            <TextInput
              placeholder="Job title, keywords"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <MultiSelect
              placeholder="Locations"
              data={['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes']}
              value={locations}
              onChange={setLocations}
              clearable
              style={{ width: 200 }}
            />
            <Select
              placeholder="Job type"
              data={Object.entries(JOB_TYPE_DISPLAY_MAP).map(([value, label]) => ({
                value,
                label
              }))}
              value={selectedJobType}
              onChange={(value) => setSelectedJobType(value as JobType | null)}
              clearable
              style={{ width: 150 }}
            />
            <Checkbox
              label="Remote only"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.currentTarget.checked)}
            />
            <Button 
              leftSection={<IconFilter size={16} />}
              onClick={handleSearch}
              loading={isLoading}
            >
              Search Jobs
            </Button>
          </Group>
          {error && (
            <Text c="red" mt="sm">
              {error}
            </Text>
          )}
        </Grid.Col>
        
        {isLoading ? (
          <Grid.Col span={12}>
            <Text c="dimmed" ta="center" py="xl">
              Loading jobs...
            </Text>
          </Grid.Col>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <Grid.Col key={job.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <JobCard job={job} onClick={(j) => console.log('Selected:', j)} />
            </Grid.Col>
          ))
        ) : (
          <Grid.Col span={12}>
            <Text c="dimmed" ta="center" py="xl">
              No jobs found. Try adjusting your search criteria.
            </Text>
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}