import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import { Modal, TextInput, Textarea, Button, Group, Stack, Title, ActionIcon, Text, Select } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { kanbanService } from '../services/kanban';
import { useAuth } from '../contexts/AuthContext';
import type { KanbanCard } from '../types/kanban';
import type { Job } from '../types/job';
import type { Interview, InterviewType } from '../types/interview';
import type { ISODateString } from '../types/core';
import { createISODateString } from '../types/core';
import { InterviewForm } from './InterviewForm';

/**
 * Interface définissant les valeurs du formulaire
 */
interface FormValues extends Omit<Job, 'id' | 'createdAt'> {
  /** Statut actuel */
  status: 'todo' | 'in-progress' | 'done';
  /** ID du job associé */
  jobId: string;
  /** Notes optionnelles */
  notes?: string;
  /** Date de création */
  createdAt: ISODateString;
  /** Date de dernière mise à jour */
  updatedAt: ISODateString;
  /** Liste des entretiens */
  interviews?: Interview[];
}

/**
 * Props du composant KanbanCardForm
 */
interface KanbanCardFormProps {
  /** Carte existante à éditer (optionnel) */
  card?: KanbanCard;
  /** Fonction appelée à la soumission du formulaire */
  onSubmit: (values: KanbanCard) => void;
  /** État d'ouverture du modal */
  opened: boolean;
  /** Fonction pour fermer le modal */
  onClose: () => void;
  /** ID du job associé */
  jobId: string;
}

/**
 * Composant de formulaire pour créer ou éditer une carte Kanban
 */
export function KanbanCardForm({ card, onSubmit, opened, onClose, jobId }: KanbanCardFormProps) {
  const { user } = useAuth();
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | undefined>(undefined);

  const form = useForm<FormValues>({
    initialValues: card ? {
      title: card.title,
      company: card.company,
      location: card.location,
      type: card.type,
      url: card.url,
      description: card.description || '',
      experienceLevel: card.experienceLevel,
      jobType: card.jobType,
      publishedAt: card.publishedAt,
      status: card.status,
      jobId: card.jobId,
      notes: card.notes,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      interviews: card.interviews || []
    } : {
      title: '',
      company: '',
      location: '',
      type: '',
      url: '',
      description: '',
      experienceLevel: 'mid',
      jobType: 'full-time',
      publishedAt: new Date().toISOString(),
      status: 'todo',
      jobId,
      notes: '',
      createdAt: createISODateString(new Date().toISOString()),
      updatedAt: createISODateString(new Date().toISOString()),
      interviews: []
    },
    validate: {
      title: (value: string | undefined) => !value ? 'Le titre est requis' : null,
      description: (value: string | undefined) => !value ? 'La description est requise' : null,
      company: (value: string | undefined) => !value ? 'La société est requise' : null,
      location: (value: string | undefined) => !value ? 'La localisation est requise' : null,
    }
  });

  const handleSubmit = (values: FormValues, event?: React.FormEvent<HTMLFormElement>) => {
    const updatedCard: KanbanCard = {
      id: card?.id || crypto.randomUUID(),
      title: values.title,
      company: values.company,
      location: values.location,
      type: values.type,
      url: values.url,
      description: values.description,
      experienceLevel: values.experienceLevel,
      jobType: values.jobType,
      publishedAt: values.publishedAt,
      status: values.status,
      jobId: values.jobId,
      notes: values.notes,
      createdAt: values.createdAt,
      updatedAt: createISODateString(new Date().toISOString()),
      interviews: values.interviews
    };
    onSubmit(updatedCard);
    form.reset();
    onClose();
  };

  const handleInterviewSave = (interview: Interview) => {
    const interviews = form.values.interviews || [];
    if (selectedInterview) {
      const index = interviews.findIndex(i => 
        i.date === selectedInterview.date && 
        i.type === selectedInterview.type
      );
      if (index !== -1) {
        interviews[index] = interview;
      }
    } else {
      interviews.push(interview);
    }
    form.setFieldValue('interviews', interviews);
    setShowInterviewForm(false);
    setSelectedInterview(undefined);
  };

  const handleInterviewDelete = (interview: Interview) => {
    const interviews = form.values.interviews || [];
    const filteredInterviews = interviews.filter(i => 
      i.date !== interview.date || 
      i.type !== interview.type
    );
    form.setFieldValue('interviews', filteredInterviews);
  };

  /**
   * Formate une date au format local
   * @param date - La date à formater
   * @returns La date formatée
   */
  const formatDate = (date: ISODateString): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Traduit le type d'entretien
   * @param type - Le type d'entretien
   * @returns Le type traduit
   */
  const translateInterviewType = (type: InterviewType): string => {
    const translations: Record<InterviewType, string> = {
      'phone': 'Téléphone',
      'video': 'Visioconférence',
      'onsite': 'Sur site',
      'technical': 'Technique'
    };
    return translations[type];
  };

  return (
    <>
      <Modal 
        opened={opened} 
        onClose={onClose} 
        title={card ? "Modifier la carte" : "Nouvelle carte"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Titre"
            placeholder="Entrez un titre"
            {...form.getInputProps('title')}
            mb="md"
          />
          <TextInput
            label="Société"
            placeholder="Entrez le nom de la société"
            {...form.getInputProps('company')}
            mb="md"
          />
          <TextInput
            label="Localisation"
            placeholder="Entrez la localisation"
            {...form.getInputProps('location')}
            mb="md"
          />
          <Textarea
            label="Description"
            placeholder="Entrez une description"
            {...form.getInputProps('description')}
            mb="md"
          />
          <Textarea
            label="Notes (optionnel)"
            placeholder="Ajoutez des notes"
            {...form.getInputProps('notes')}
            mb="md"
          />
          <Button type="submit" fullWidth mt="md">
            {card ? "Mettre à jour" : "Créer"}
          </Button>
        </form>
      </Modal>

      <InterviewForm
        opened={showInterviewForm}
        onClose={() => {
          setShowInterviewForm(false);
          setSelectedInterview(undefined);
        }}
        onSave={handleInterviewSave}
        interview={selectedInterview}
      />
    </>
  );
} 