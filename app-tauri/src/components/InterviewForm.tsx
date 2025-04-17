import React from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Interview, InterviewType, ISODateString, createISODateString } from '../types/index';

/**
 * Props pour le composant InterviewForm
 */
interface InterviewFormProps {
  /** Indique si le modal est ouvert */
  opened: boolean;
  /** Fonction appelée lors de la fermeture du modal */
  onClose: () => void;
  /** Données de l'entretien à modifier (optionnel) */
  interview?: Interview;
  /** Fonction appelée lors de la sauvegarde de l'entretien */
  onSave: (interview: Interview) => void;
}

/**
 * Types d'entretiens disponibles avec leurs traductions
 */
const INTERVIEW_TYPES: Record<InterviewType, string> = {
  phone: 'Téléphone',
  video: 'Visioconférence',
  onsite: 'Sur site',
  technical: 'Technique'
};

/**
 * Interface pour les valeurs du formulaire
 */
interface FormValues {
  /** Date de l'entretien au format ISO */
  date: ISODateString;
  /** Type d'entretien */
  type: InterviewType;
  /** Notes sur l'entretien (optionnel) */
  notes: string;
}

/**
 * Composant de formulaire pour la création et l'édition d'un entretien
 * @param props - Les propriétés du composant
 * @returns Le composant de formulaire
 */
export function InterviewForm({ opened, onClose, interview, onSave }: InterviewFormProps) {
  const form = useForm<FormValues>({
    initialValues: {
      date: interview?.date || createISODateString(new Date().toISOString()),
      type: interview?.type || 'phone',
      notes: interview?.notes || '',
    },
    validate: {
      date: (value) => (!value ? 'La date est requise' : null),
      type: (value) => (!INTERVIEW_TYPES[value as InterviewType] ? 'Le type est invalide' : null),
    },
    transformValues: (values) => ({
      ...values,
      date: createISODateString(values.date),
    }),
  });

  const handleSubmit = (values: FormValues) => {
    onSave({
      date: values.date,
      type: values.type,
      notes: values.notes.trim(),
    });
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={interview ? 'Modifier l\'entretien' : 'Nouvel entretien'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Date"
            type="date"
            description="Date prévue de l'entretien"
            required
            {...form.getInputProps('date')}
          />

          <Select
            label="Type d'entretien"
            data={Object.entries(INTERVIEW_TYPES).map(([value, label]) => ({
              value,
              label,
            }))}
            description="Sélectionnez le type d'entretien"
            required
            {...form.getInputProps('type')}
          />

          <Textarea
            label="Notes"
            placeholder="Ajoutez des notes sur l'entretien..."
            description="Informations importantes, questions à poser, etc."
            minRows={3}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {interview ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 