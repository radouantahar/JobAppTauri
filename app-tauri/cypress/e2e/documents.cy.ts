describe('Gestion des Documents', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/documents');
  });

  it('devrait afficher la liste des documents', () => {
    cy.get('[data-testid="document-list"]').should('exist');
    cy.get('[data-testid="document-card"]').should('have.length.at.least', 1);
  });

  it('devrait permettre de créer un nouveau document', () => {
    cy.get('[data-testid="create-document-button"]').click();
    cy.get('[data-testid="document-form"]').should('exist');

    cy.get('[data-testid="document-title"]').type('Nouveau CV');
    cy.get('[data-testid="document-type"]').select('CV');
    cy.get('[data-testid="document-content"]').type('Contenu du CV');
    cy.get('[data-testid="save-document-button"]').click();

    cy.get('[data-testid="document-list"]').should('contain', 'Nouveau CV');
  });

  it('devrait permettre de modifier un document existant', () => {
    cy.get('[data-testid="document-card"]').first().click();
    cy.get('[data-testid="edit-document-button"]').click();

    cy.get('[data-testid="document-title"]').clear().type('CV Modifié');
    cy.get('[data-testid="save-document-button"]').click();

    cy.get('[data-testid="document-list"]').should('contain', 'CV Modifié');
  });

  it('devrait permettre de supprimer un document', () => {
    cy.get('[data-testid="document-card"]').first().click();
    cy.get('[data-testid="delete-document-button"]').click();
    cy.get('[data-testid="confirm-delete-button"]').click();

    cy.get('[data-testid="document-list"]').should('not.contain', 'CV Modifié');
  });

  it('devrait permettre d\'utiliser un modèle de document', () => {
    cy.get('[data-testid="use-template-button"]').click();
    cy.get('[data-testid="template-list"]').should('exist');
    
    cy.get('[data-testid="template-card"]').first().click();
    cy.get('[data-testid="document-form"]').should('exist');
    cy.get('[data-testid="document-content"]').should('not.be.empty');
  });

  it('devrait permettre d\'exporter un document', () => {
    cy.get('[data-testid="document-card"]').first().click();
    cy.get('[data-testid="export-document-button"]').click();
    cy.get('[data-testid="export-options"]').should('exist');
    
    cy.get('[data-testid="export-pdf"]').click();
    // Vérifier que le fichier est téléchargé
    cy.verifyDownload('document.pdf');
  });

  it('devrait permettre de filtrer les documents par type', () => {
    cy.get('[data-testid="filter-type"]').select('CV');
    cy.get('[data-testid="document-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'CV');
    });
  });

  it('devrait afficher un message si aucun document n\'existe', () => {
    // Supprimer tous les documents
    cy.get('[data-testid="document-card"]').each(($card) => {
      cy.wrap($card).click();
      cy.get('[data-testid="delete-document-button"]').click();
      cy.get('[data-testid="confirm-delete-button"]').click();
    });

    cy.get('[data-testid="no-documents"]').should('exist');
  });

  it('devrait permettre de prévisualiser un document', () => {
    cy.get('[data-testid="document-card"]').first().click();
    cy.get('[data-testid="preview-button"]').click();
    cy.get('[data-testid="document-preview"]').should('exist');
  });

  it('devrait permettre de partager un document', () => {
    cy.get('[data-testid="document-card"]').first().click();
    cy.get('[data-testid="share-button"]').click();
    cy.get('[data-testid="share-options"]').should('exist');
    
    cy.get('[data-testid="share-email"]').type('test@example.com');
    cy.get('[data-testid="share-submit"]').click();
    cy.get('[data-testid="share-success"]').should('exist');
  });
}); 