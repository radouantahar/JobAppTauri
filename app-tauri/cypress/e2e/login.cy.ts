describe('Page de connexion', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('devrait afficher le formulaire de connexion', () => {
    cy.get('[data-testid="email-input"]').should('exist');
    cy.get('[data-testid="password-input"]').should('exist');
    cy.get('[data-testid="login-button"]').should('exist');
  });

  it('devrait afficher une erreur avec des identifiants invalides', () => {
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });
  it('devrait se connecter avec succès avec des identifiants valides', () => {
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('devrait rediriger vers la page de connexion si non authentifié', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
  it('devrait conserver la session après le rafraîchissement', () => {
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.reload();
    cy.get('[data-testid="user-menu"]').should('exist');
  });
});