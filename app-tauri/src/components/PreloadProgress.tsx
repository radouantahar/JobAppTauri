import React from 'react';
import { Progress, Alert, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { usePreloadData } from '../hooks/usePreloadData';

export const PreloadProgress: React.FC = () => {
  const { preloadProgress, preloadError } = usePreloadData();

  if (preloadError) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Erreur de chargement" color="red" variant="filled">
        {preloadError.message}
      </Alert>
    );
  }

  if (preloadProgress < 100) {
    return (
      <Stack gap="sm" align="center">
        <Progress value={preloadProgress} size="xl" w="100%" />
        <Text ta="center" fz="sm">{preloadProgress}%</Text>
      </Stack>
    );
  }

  return null;
}; 