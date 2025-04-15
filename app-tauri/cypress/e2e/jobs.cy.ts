describe('Gestion des Offres d\'Emploi', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/jobs');
  });

  it('devrait afficher la liste des offres', () => {
    cy.get('[data-testid="job-list"]').should('exist');
    cy.get('[data-testid="job-card"]').should('have.length.at.least', 1);
  });

  it('devrait afficher les détails d\'une offre', () => {
    cy.get('[data-testid="job-card"]').first().click();
    cy.get('[data-testid="job-details"]').should('exist');
    cy.get('[data-testid="job-title"]').should('exist');
    cy.get('[data-testid="job-company"]').should('exist');
    cy.get('[data-testid="job-description"]').should('exist');
  });

  it('devrait permettre de sauvegarder une offre', () => {
    cy.get('[data-testid="job-card"]').first().within(() => {
      cy.get('[data-testid="save-button"]').click();
    });
    cy.get('[data-testid="saved-jobs"]').should('contain', '1');
  });

  it('devrait permettre de postuler à une offre', () => {
    cy.get('[data-testid="job-card"]').first().within(() => {
      cy.get('[data-testid="apply-button"]').click();
    });
    cy.get('[data-testid="job-status"]').should('contain', 'Postulé');
  });

  it('devrait permettre de filtrer les offres', () => {
    cy.get('[data-testid="filter-input"]').type('développeur');
    cy.get('[data-testid="job-card"]').should('have.length.at.least', 1);
    cy.get('[data-testid="job-title"]').each(($title) => {
      expect($title.text().toLowerCase()).to.include('développeur');
    });
  });

  it('devrait permettre de trier les offres par score', () => {
    cy.get('[data-testid="sort-select"]').select('score');
    cy.get('[data-testid="job-card"]').first().within(() => {
      cy.get('[data-testid="matching-score"]').should('contain', '90');
    });
  });

  it('devrait afficher les statistiques des offres', () => {
    cy.get('[data-testid="stats-button"]').click();
    cy.get('[data-testid="job-stats"]').should('exist');
    cy.get('[data-testid="total-jobs"]').should('exist');
    cy.get('[data-testid="status-distribution"]').should('exist');
  });

  it('devrait permettre de mettre à jour le statut d\'une offre', () => {
    cy.get('[data-testid="job-card"]').first().click();
    cy.get('[data-testid="status-select"]').select('interview');
    cy.get('[data-testid="job-status"]').should('contain', 'Entretien');
  });

  it('devrait afficher un message si aucune offre ne correspond aux critères', () => {
    cy.get('[data-testid="filter-input"]').type('inexistant');
    cy.get('[data-testid="no-results"]').should('exist');
  });

  it('devrait permettre d\'exporter les offres', () => {
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-options"]').should('exist');
    cy.get('[data-testid="export-csv"]').click();
    // Vérifier que le fichier est téléchargé
    cy.verifyDownload('jobs.csv');
  });
}); 