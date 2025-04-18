import { 
  Job, 
  User, 
  Application, 
  Document,
  ExperienceLevel,
  JobType,
  CommuteMode,
  ApplicationStatus
} from '../../types/models';

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Développeur Full Stack',
  company: 'Tech Corp',
  location: 'Paris',
  type: JobType.FULL_TIME,
  postedAt: new Date().toISOString(),
  experienceLevel: ExperienceLevel.MID,
  salary: {
    min: 40000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  description: 'Description du poste',
  url: 'https://example.com/job',
  remote: false,
  skills: ['JavaScript', 'TypeScript'],
  jobType: JobType.FULL_TIME,
  commuteTimes: [],
  source: 'linkedin',
  ...overrides
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    notifications: true,
    theme: 'light',
    language: 'fr'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockApplication = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  jobId: '1',
  userId: '1',
  status: ApplicationStatus.APPLIED,
  notes: '',
  followUpDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: '1',
  name: 'CV.pdf',
  type: 'application/pdf',
  size: 1024,
  path: '/documents/cv.pdf',
  metadata: {
    title: 'CV',
    description: 'Curriculum Vitae',
    tags: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
}); 