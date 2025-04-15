import { mount } from 'cypress/react18';
import '@testing-library/cypress/add-commands';

// Ajouter des commandes personnalisées ici
Cypress.Commands.add('mount', mount);

// Types pour les commandes personnalisées
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
} 