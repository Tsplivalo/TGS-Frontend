/// <reference types="cypress" />

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.dataCy('register-tab').click(); // Switch to register tab if needed
  });

  it('should register a new user successfully', () => {
    const newUser = {
      name: 'New User',
      email: `newuser${Date.now()}@example.com`,
      password: 'NewUser123!'
    };

    cy.intercept('POST', '/api/auth/register').as('registerRequest');

    cy.dataCy('name-input').type(newUser.name);
    cy.dataCy('email-input').type(newUser.email);
    cy.dataCy('password-input').type(newUser.password);
    cy.dataCy('confirm-password-input').type(newUser.password);
    cy.dataCy('terms-checkbox').check();
    cy.dataCy('register-button').click();

    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);

    cy.dataCy('success-message')
      .should('be.visible')
      .and('contain.text', 'Registration successful');
  });

  it('should show error when passwords do not match', () => {
    cy.dataCy('name-input').type('Test User');
    cy.dataCy('email-input').type('test@example.com');
    cy.dataCy('password-input').type('Password123!');
    cy.dataCy('confirm-password-input').type('DifferentPassword123!');

    cy.get('[data-cy=password-mismatch-error]')
      .should('be.visible')
      .and('contain.text', 'Passwords do not match');
  });

  it('should show error for weak password', () => {
    cy.dataCy('password-input').type('weak');
    cy.dataCy('password-input').blur();

    cy.get('[data-cy=password-strength-error]')
      .should('be.visible')
      .and('contain.text', 'Password must be at least 8 characters');
  });

  it('should require terms and conditions acceptance', () => {
    cy.dataCy('name-input').type('Test User');
    cy.dataCy('email-input').type('test@example.com');
    cy.dataCy('password-input').type('Password123!');
    cy.dataCy('confirm-password-input').type('Password123!');
    cy.dataCy('register-button').click();

    cy.get('[data-cy=terms-error]')
      .should('be.visible')
      .and('contain.text', 'You must accept the terms');
  });

  it('should have no accessibility violations', () => {
    cy.injectAxe();
    cy.checkA11y('[data-cy=register-form]');
  });
});
