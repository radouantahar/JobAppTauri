/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchFilters } from '../SearchFilters';
import type { JobType, ExperienceLevel } from '../../../types';

describe('SearchFilters', () => {
  const defaultProps = {
    keywords: '',
    setKeywords: vi.fn(),
    location: '',
    setLocation: vi.fn(),
    jobTypes: [] as JobType[],
    setJobTypes: vi.fn(),
    experienceLevels: [] as ExperienceLevel[],
    setExperienceLevels: vi.fn(),
    salaryMin: '' as const,
    setSalaryMin: vi.fn(),
    datePosted: 'any' as const,
    setDatePosted: vi.fn(),
    onSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre tous les champs de filtrage', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText('Type de contrat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Localisation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Niveau d'expérience")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Salaire minimum')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Date de publication')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechercher' })).toBeInTheDocument();
  });

  it('devrait appeler setLocation lors de la saisie de la localisation', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const locationInput = screen.getByPlaceholderText('Localisation');
    fireEvent.change(locationInput, { target: { value: 'Paris' } });
    
    expect(defaultProps.setLocation).toHaveBeenCalledWith('Paris');
  });

  it('devrait appeler setSalaryMin avec le bon format lors de la saisie du salaire', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const salaryInput = screen.getByPlaceholderText('Salaire minimum');
    fireEvent.change(salaryInput, { target: { value: '50000' } });
    
    expect(defaultProps.setSalaryMin).toHaveBeenCalledWith(50000);
  });

  it('devrait appeler setJobTypes avec un tableau vide lors de la suppression du type de contrat', () => {
    render(<SearchFilters {...defaultProps} jobTypes={['full-time' as JobType]} />);
    
    const jobTypeSelect = screen.getByPlaceholderText('Type de contrat');
    fireEvent.click(jobTypeSelect);
    const clearButton = screen.getByLabelText('Clear');
    fireEvent.click(clearButton);
    
    expect(defaultProps.setJobTypes).toHaveBeenCalledWith([]);
  });

  it('devrait appeler onSearch lors du clic sur le bouton Rechercher', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: 'Rechercher' });
    fireEvent.click(searchButton);
    
    expect(defaultProps.onSearch).toHaveBeenCalled();
  });

  it('devrait appeler setExperienceLevels avec les bonnes valeurs', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const experienceSelect = screen.getByPlaceholderText("Niveau d'expérience");
    fireEvent.click(experienceSelect);
    
    const entryOption = screen.getByText('Débutant');
    fireEvent.click(entryOption);
    
    expect(defaultProps.setExperienceLevels).toHaveBeenCalledWith(['entry' as ExperienceLevel]);
  });

  // Test des cas limites
  it('devrait gérer correctement les valeurs vides', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const salaryInput = screen.getByPlaceholderText('Salaire minimum');
    fireEvent.change(salaryInput, { target: { value: '' } });
    
    expect(defaultProps.setSalaryMin).toHaveBeenCalledWith('');
  });

  // Test des cas d'erreur
  it('devrait ignorer les valeurs de salaire négatives', () => {
    render(<SearchFilters {...defaultProps} />);
    
    const salaryInput = screen.getByPlaceholderText('Salaire minimum');
    fireEvent.change(salaryInput, { target: { value: '-1000' } });
    
    expect(defaultProps.setSalaryMin).not.toHaveBeenCalledWith(-1000);
  });
}); 