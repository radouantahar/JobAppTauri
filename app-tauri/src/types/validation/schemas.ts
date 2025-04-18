import { z } from 'zod';
import { JobSource, JobType, ExperienceLevel, CommuteMode } from '../models/job';

/**
 * Schéma de validation pour un identifiant
 */
export const idSchema = z.string().min(1);

/**
 * Schéma de validation pour une date ISO
 */
export const isoDateSchema = z.string().refine(
  (date: string) => !isNaN(new Date(date).getTime()),
  { message: 'Invalid ISO date string' }
);

/**
 * Schéma de validation pour un salaire
 */
export const salarySchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().min(1),
  period: z.enum(['hour', 'day', 'week', 'month', 'year'])
});

/**
 * Schéma de validation pour un temps de trajet
 */
export const commuteTimeSchema = z.object({
  mode: z.enum(['walking', 'biking', 'driving', 'transit']),
  duration: z.number().min(0),
  distance: z.number().min(0)
});

/**
 * Schéma de validation pour une offre d'emploi
 */
export const jobSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  postedAt: isoDateSchema,
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  salary: salarySchema,
  description: z.string(),
  url: z.string().url(),
  remote: z.boolean(),
  skills: z.array(z.string()),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  commuteTimes: z.array(commuteTimeSchema),
  source: z.enum(['linkedin', 'indeed', 'glassdoor', 'company', 'other'])
});

/**
 * Schéma de validation pour un utilisateur
 */
export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

/**
 * Schéma de validation pour une candidature
 */
export const applicationSchema = z.object({
  id: idSchema,
  jobId: idSchema,
  userId: idSchema,
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']),
  notes: z.string().optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
}); 