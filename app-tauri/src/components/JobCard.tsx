import { Card, Text, Badge, Group, Button } from '@mantine/core';
import { IconMapPin, IconBriefcase, IconClock, IconExternalLink } from '@tabler/icons-react';
import { Job } from '../types';
import classes from './JobCard.module.css'; // Create this CSS module file

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  // Formater le temps de trajet
  const formatCommuteTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };
  
  // Déterminer la couleur du score de correspondance
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'lime';
    if (score >= 0.4) return 'yellow';
    if (score >= 0.2) return 'orange';
    return 'red';
  };

  // Format salary to string if it's an object
  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return '';
    
    const { min, max, currency = 'USD', period = 'year' } = salary;
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'EUR' ? '€' : 
                          currency === 'GBP' ? '£' : 
                          currency === 'CHF' ? 'CHF' : currency;
    
    let salaryText = '';
    if (min && max) {
      salaryText = `${currencySymbol}${min} - ${currencySymbol}${max}`;
    } else if (min) {
      salaryText = `${currencySymbol}${min}+`;
    } else if (max) {
      salaryText = `Up to ${currencySymbol}${max}`;
    }
    
    if (salaryText) {
      salaryText += period === 'hour' ? '/hr' : 
                   period === 'week' ? '/week' : 
                   period === 'month' ? '/month' : '/year';
    }
    
    return salaryText;
  };

  return (
    <Card shadow="sm" padding={0} radius="md" className={classes.card}>
      <Card.Section className={classes.body}>
        <Group justify="space-between" mb="xs">
          <Text className={classes.title} lineClamp={2}>{job.title}</Text>
          <Badge color={getScoreColor(job.matchingScore)} variant="filled">
            {Math.round(job.matchingScore * 100)}%
          </Badge>
        </Group>
        
        <Text size="sm" c="dimmed" mb="md">{job.company}</Text>
        
        <Group gap="xs" mb="xs">
          <IconMapPin size={16} />
          <Text size="sm">{job.location}</Text>
        </Group>
        
        {job.salary && (
          <Group gap="xs" mb="xs">
            <IconBriefcase size={16} />
            <Text size="sm">{formatSalary(job.salary)}</Text>
          </Group>
        )}
        
        <Group justify="space-between" mt="md">
          <Group gap="xs">
            <IconClock size={16} />
            <Badge 
              className={classes.commuteBadge} 
              color="blue" 
              variant="outline"
              title="Temps de trajet depuis le domicile principal"
            >
              P: {formatCommuteTime(job.commuteTimes.primaryHome.duration)}
            </Badge>
            
            {job.commuteTimes.secondaryHome && (
              <Badge 
                className={classes.commuteBadge} 
                color="violet" 
                variant="outline"
                title="Temps de trajet depuis le domicile secondaire"
              >
                S: {formatCommuteTime(job.commuteTimes.secondaryHome.duration)}
              </Badge>
            )}
          </Group>
          
          <Button 
            variant="light" 
            color="blue" 
            size="compact-md"
            rightSection={<IconExternalLink size={16} />}
            onClick={() => onClick(job)}
          >
            Détails
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
}