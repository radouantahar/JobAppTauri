describe('Authentification', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('devrait afficher le formulaire de connexion', () => {
    cy.get('[data-testid="login-form"]').should('exist');
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

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('devrait afficher le formulaire d\'inscription', () => {
    cy.get('[data-testid="register-link"]').click();
    cy.url().should('include', '/register');

    cy.get('[data-testid="register-form"]').should('exist');
    cy.get('[data-testid="name-input"]').should('exist');
    cy.get('[data-testid="email-input"]').should('exist');
    cy.get('[data-testid="password-input"]').should('exist');
    cy.get('[data-testid="register-button"]').should('exist');
  });

  it('devrait s\'inscrire avec succès', () => {
    cy.get('[data-testid="register-link"]').click();

    cy.get('[data-testid="name-input"]').type('New User');
    cy.get('[data-testid="email-input"]').type('new@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="register-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('devrait afficher une erreur si l\'email existe déjà', () => {
    cy.get('[data-testid="register-link"]').click();

    cy.get('[data-testid="name-input"]').type('Existing User');
    cy.get('[data-testid="email-input"]').type('existing@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="register-button"]').click();

    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('devrait se déconnecter avec succès', () => {
    // Se connecter d'abord
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Se déconnecter
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    cy.url().should('include', '/login');
    cy.get('[data-testid="login-form"]').should('exist');
  });

  it('devrait rediriger vers la page de connexion si non authentifié', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('devrait conserver la session après le rafraîchissement', () => {
    // Se connecter
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Rafraîchir la page
    cy.reload();

    // Vérifier que l'utilisateur est toujours connecté
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('exist');
  });
}); 