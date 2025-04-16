import { SearchFormProps, SearchFilters } from '../../types';

export const createMockSearchFormProps = (overrides: Partial<SearchFormProps> = {}): SearchFormProps => ({
  onSubmit: vi.fn(),
  initialFilters: createMockSearchFilters(),
  ...overrides
});

export const createMockSearchFilters = (overrides: Partial<SearchFilters> = {}): SearchFilters => ({
  keywords: '',
  location: '',
  salaryMin: null,
  salaryMax: null,
  contractTypes: [],
  experienceLevels: [],
  remote: undefined,
  skills: [],
  datePosted: null,
  sortBy: 'relevance',
  ...overrides
}); 