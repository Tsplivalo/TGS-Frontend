// ***********************************************************
// This file is processed and loaded automatically before test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Import cypress-real-events for realistic user interactions
import 'cypress-real-events';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook for all tests
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();

  // Inject axe-core for accessibility testing
  cy.injectAxe();
});

// Handle uncaught exceptions gracefully in tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Use with caution - log the error for debugging
  console.error('Uncaught exception:', err.message);

  // Don't fail tests on certain expected errors
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }

  // Allow the test to fail on other errors
  return true;
});

// Custom configuration
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 30000);
