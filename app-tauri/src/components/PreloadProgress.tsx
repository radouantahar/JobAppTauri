import React from 'react';
import { Progress, Alert, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { usePreloadData } from '../hooks/usePreloadData';
import classes from '../styles/components/PreloadProgress.module.css';

export const PreloadProgress: React.FC = () => {
  const { preloadProgress, preloadError } = usePreloadData();

  if (preloadError) {
    return (
      <div className={classes.container}>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Erreur de chargement" 
          color="red" 
          variant="filled"
          className={classes.errorContainer}
        >
          {preloadError.message}
        </Alert>
      </div>
    );
  }

  if (preloadProgress < 100) {
    return (
      <div className={classes.container}>
        <div className={classes.progressContainer}>
          <Progress 
            value={preloadProgress} 
            size="xl" 
            w="100%" 
            className={classes.progressBar}
          />
          <Text className={classes.progressLabel}>{preloadProgress}%</Text>
        </div>
      </div>
    );
  }

  return null;
}; 