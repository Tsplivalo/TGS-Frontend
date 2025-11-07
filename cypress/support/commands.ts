/// <reference types="cypress" />
/// <reference types="cypress-axe" />

// ***********************************************
// This file contains custom Cypress commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('admin@tgs.com', 'Admin123!')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to logout a user
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to register a new user
       * @example cy.register('test@example.com', 'Test123!', 'Test User')
       */
      register(email: string, password: string, name: string): Chainable<void>;

      /**
       * Custom command to check if user is authenticated
       * @example cy.isAuthenticated()
       */
      isAuthenticated(): Chainable<boolean>;

      /**
       * Custom command to get local storage item
       * @example cy.getLocalStorage('authToken')
       */
      getLocalStorage(key: string): Chainable<string | null>;

      /**
       * Custom command to set local storage item
       * @example cy.setLocalStorage('authToken', 'token123')
       */
      setLocalStorage(key: string, value: string): Chainable<void>;

      /**
       * Custom command to wait for Angular to be ready
       * @example cy.waitForAngular()
       */
      waitForAngular(): Chainable<void>;

      /**
       * Custom command to check accessibility violations
       * @example cy.checkA11y()
       */
      checkA11y(context?: any, options?: any): Chainable<void>;

      /**
       * Custom command to navigate to a route
       * @example cy.navigateTo('/tienda')
       */
      navigateTo(route: string): Chainable<void>;

      /**
       * Custom command to get by data-cy attribute
       * @example cy.dataCy('login-button')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * Login command
 * Logs in a user with email and password
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/');

    // Wait for the page to load
    cy.waitForAngular();

    // Fill login form
    cy.dataCy('email-input').should('be.visible').type(email);
    cy.dataCy('password-input').should('be.visible').type(password);
    cy.dataCy('login-button').should('be.visible').click();

    // Wait for login to complete
    cy.url().should('not.include', '/login');

    // Verify token exists in localStorage
    cy.getLocalStorage('authToken').should('exist');
  });
});

/**
 * Logout command
 * Logs out the current user
 */
Cypress.Commands.add('logout', () => {
  cy.dataCy('user-menu').click();
  cy.dataCy('logout-button').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

/**
 * Register command
 * Registers a new user
 */
Cypress.Commands.add('register', (email: string, password: string, name: string) => {
  cy.visit('/');
  cy.dataCy('register-tab').click();
  cy.dataCy('name-input').type(name);
  cy.dataCy('email-input').type(email);
  cy.dataCy('password-input').type(password);
  cy.dataCy('confirm-password-input').type(password);
  cy.dataCy('register-button').click();
});

/**
 * Check if user is authenticated
 */
Cypress.Commands.add('isAuthenticated', () => {
  return cy.getLocalStorage('authToken').then((token) => {
    return !!token;
  });
});

/**
 * Get local storage item
 */
Cypress.Commands.add('getLocalStorage', (key: string) => {
  return cy.window().then((window) => {
    return window.localStorage.getItem(key);
  });
});

/**
 * Set local storage item
 */
Cypress.Commands.add('setLocalStorage', (key: string, value: string) => {
  cy.window().then((window) => {
    window.localStorage.setItem(key, value);
  });
});

/**
 * Wait for Angular to be ready
 */
Cypress.Commands.add('waitForAngular', () => {
  cy.window().should('have.property', 'ng');
  cy.wait(500); // Small delay to ensure Angular is fully loaded
});

/**
 * Check accessibility using axe-core
 */
Cypress.Commands.add('checkA11y', (context?: any, options?: any) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    if (violations.length) {
      cy.task('log', '\n🚨 Accessibility Violations:\n');
      cy.task('table', violations);
    }
  });
});

/**
 * Navigate to a route
 */
Cypress.Commands.add('navigateTo', (route: string) => {
  cy.visit(route);
  cy.waitForAngular();
});

/**
 * Get element by data-cy attribute
 */
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy="${value}"]`);
});

// Export empty object to satisfy TypeScript module system
export {};
