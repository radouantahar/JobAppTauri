import { JobCard } from '../../src/components/JobCard';
import { Job } from '../../src/types';

describe('JobCard', () => {
  const mockJob: Job = {
    id: 1,
    title: 'Développeur Full Stack',
    company: 'Tech Corp',
    location: 'Paris',
    matchingScore: 0.85,
    salary: {
      min: 50000,
      max: 70000,
      currency: 'EUR',
      period: 'year'
    },
    commuteTimes: {
      primaryHome: {
        duration: 45,
        distance: 10
      },
      secondaryHome: {
        duration: 30,
        distance: 8
      }
    }
  };

  it('devrait afficher correctement les informations du job', () => {
    cy.mount(<JobCard job={mockJob} onClick={cy.stub()} />);
    cy.get('[data-testid="job-title"]').should('contain', 'Développeur Full Stack');
    cy.get('[data-testid="job-company"]').should('contain', 'Tech Corp');
    cy.get('[data-testid="job-location"]').should('contain', 'Paris');
    cy.get('[data-testid="job-salary"]').should('contain', '€50000 - €70000/year');
    cy.get('[data-testid="job-score"]').should('contain', '85%');
  });

  it('devrait appeler onClick lors du clic sur le bouton Détails', () => {
    const onClick = cy.stub();
    cy.mount(<JobCard job={mockJob} onClick={onClick} />);
    cy.get('[data-testid="job-details-button"]').click();
    cy.wrap(onClick).should('have.been.calledWith', mockJob);
  });

  it('devrait gérer correctement les jobs sans salaire', () => {
    const jobWithoutSalary = { ...mockJob, salary: undefined };
    cy.mount(<JobCard job={jobWithoutSalary} onClick={cy.stub()} />);
    cy.get('[data-testid="job-salary"]').should('not.exist');
  });

  it('devrait gérer correctement les jobs sans domicile secondaire', () => {
    const jobWithoutSecondaryHome = {
      ...mockJob,
      commuteTimes: {
        primaryHome: mockJob.commuteTimes.primaryHome
      }
    };
    cy.mount(<JobCard job={jobWithoutSecondaryHome} onClick={cy.stub()} />);
    cy.get('[data-testid="commute-secondary"]').should('not.exist');
  });

  it('devrait afficher la bonne couleur pour le score de correspondance', () => {
    cy.mount(<JobCard job={mockJob} onClick={cy.stub()} />);
    cy.get('[data-testid="job-score"]').should('have.class', 'mantine-Badge-green');
  });
}); 