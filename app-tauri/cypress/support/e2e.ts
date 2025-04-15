import '@testing-library/cypress/add-commands';

// Ajouter des commandes personnalisées ici
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
});

Cypress.Commands.add('createJob', (jobData: any) => {
  cy.visit('/jobs/new');
  cy.get('[data-testid="job-title"]').type(jobData.title);
  cy.get('[data-testid="job-company"]').type(jobData.company);
  cy.get('[data-testid="job-location"]').type(jobData.location);
  cy.get('[data-testid="job-salary-min"]').type(jobData.salary.min);
  cy.get('[data-testid="job-salary-max"]').type(jobData.salary.max);
  cy.get('[data-testid="job-submit"]').click();
});

Cypress.Commands.add('searchJobs', (keywords: string, location: string) => {
  cy.visit('/search');
  cy.get('[data-testid="search-keywords"]').type(keywords);
  cy.get('[data-testid="search-location"]').type(location);
  cy.get('[data-testid="search-submit"]').click();
}); 