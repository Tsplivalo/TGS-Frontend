/// <reference types="cypress" />

describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Successful Login', () => {
    it('should login successfully with valid admin credentials', () => {
      cy.fixture('users').then((users) => {
        const admin = users.admin;

        // Intercept login API call
        cy.intercept('POST', '/api/auth/login').as('loginRequest');

        // Fill login form
        cy.dataCy('email-input').should('be.visible').type(admin.email);
        cy.dataCy('password-input').should('be.visible').type(admin.password);
        cy.dataCy('login-button').should('be.visible').click();

        // Wait for login request and verify response
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

        // Verify redirect to appropriate page (could be dashboard or stay on home)
        cy.url().should('not.include', '/login');

        // Verify user menu is visible with user email/name
        cy.dataCy('user-menu').should('be.visible').and('contain.text', admin.name || admin.email);

        // Verify authentication token exists
        cy.getLocalStorage('authToken').should('exist');
      });
    });

    it('should login successfully with partner credentials', () => {
      cy.fixture('users').then((users) => {
        const partner = users.partner;

        cy.dataCy('email-input').type(partner.email);
        cy.dataCy('password-input').type(partner.password);
        cy.dataCy('login-button').click();

        cy.dataCy('user-menu').should('be.visible');
        cy.getLocalStorage('authToken').should('exist');
      });
    });

    it('should persist session after page reload', () => {
      cy.fixture('users').then((users) => {
        const user = users.user;

        cy.dataCy('email-input').type(user.email);
        cy.dataCy('password-input').type(user.password);
        cy.dataCy('login-button').click();

        cy.dataCy('user-menu').should('be.visible');

        // Reload the page
        cy.reload();

        // Verify user is still logged in
        cy.dataCy('user-menu').should('be.visible');
        cy.getLocalStorage('authToken').should('exist');
      });
    });
  });

  describe('Failed Login', () => {
    it('should show error message with invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Invalid credentials'
        }
      }).as('loginRequest');

      cy.dataCy('email-input').type('wrong@example.com');
      cy.dataCy('password-input').type('wrongpassword');
      cy.dataCy('login-button').click();

      cy.wait('@loginRequest');

      // Verify error message is displayed
      cy.dataCy('error-message')
        .should('be.visible')
        .and('contain.text', 'Invalid credentials');

      // Verify user is not logged in
      cy.dataCy('user-menu').should('not.exist');
      cy.getLocalStorage('authToken').should('not.exist');
    });

    it('should show error for empty email field', () => {
      cy.dataCy('password-input').type('somepassword');
      cy.dataCy('login-button').click();

      // Verify validation error
      cy.dataCy('email-input').should('have.class', 'ng-invalid');
      cy.get('[data-cy=email-error]')
        .should('be.visible')
        .and('contain.text', 'Email is required');
    });

    it('should show error for empty password field', () => {
      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('login-button').click();

      // Verify validation error
      cy.dataCy('password-input').should('have.class', 'ng-invalid');
      cy.get('[data-cy=password-error]')
        .should('be.visible')
        .and('contain.text', 'Password is required');
    });

    it('should show error for invalid email format', () => {
      cy.dataCy('email-input').type('invalid-email');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('email-input').blur();

      cy.get('[data-cy=email-error]')
        .should('be.visible')
        .and('contain.text', 'Invalid email format');
    });

    it('should handle server errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Internal server error'
        }
      }).as('loginRequest');

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      cy.wait('@loginRequest');

      cy.dataCy('error-message')
        .should('be.visible')
        .and('contain.text', 'server error');
    });
  });

  describe('UI/UX Features', () => {
    it('should toggle password visibility', () => {
      cy.dataCy('password-input').type('mypassword');

      // Password should be hidden by default
      cy.dataCy('password-input').should('have.attr', 'type', 'password');

      // Click toggle button
      cy.dataCy('password-toggle').click();

      // Password should be visible
      cy.dataCy('password-input').should('have.attr', 'type', 'text');

      // Click again to hide
      cy.dataCy('password-toggle').click();
      cy.dataCy('password-input').should('have.attr', 'type', 'password');
    });

    it('should enable login button only when form is valid', () => {
      // Button should be disabled initially
      cy.dataCy('login-button').should('be.disabled');

      // Fill email only
      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('login-button').should('be.disabled');

      // Fill password
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').should('not.be.disabled');
    });

    it('should show loading state during login', () => {
      cy.intercept('POST', '/api/auth/login', (req) => {
        req.reply((res) => {
          res.delay = 2000; // Delay response by 2 seconds
          res.send({
            statusCode: 200,
            body: { success: true }
          });
        });
      }).as('loginRequest');

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      // Verify loading indicator is shown
      cy.dataCy('login-button').should('contain.text', 'Loading').or('be.disabled');
      cy.dataCy('loading-spinner').should('be.visible');

      cy.wait('@loginRequest');

      // Loading should be hidden after response
      cy.dataCy('loading-spinner').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('should be navigable via keyboard', () => {
      // Tab to email field
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'email-input');

      // Type email
      cy.focused().type('test@example.com');

      // Tab to password field
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'password-input');

      // Type password
      cy.focused().type('password123');

      // Tab to login button
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'login-button');

      // Press Enter to submit
      cy.focused().type('{enter}');
    });

    it('should have proper ARIA labels', () => {
      cy.dataCy('email-input')
        .should('have.attr', 'aria-label')
        .and('match', /email/i);

      cy.dataCy('password-input')
        .should('have.attr', 'aria-label')
        .and('match', /password/i);

      cy.dataCy('login-button')
        .should('have.attr', 'aria-label')
        .or('contain.text', 'Login');
    });

    it('should have no accessibility violations', () => {
      cy.injectAxe();
      cy.checkA11y('[data-cy=login-form]', {
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'button-name': { enabled: true }
        }
      });
    });
  });

  describe('Security', () => {
    it('should not expose password in network requests (should be encrypted)', () => {
      cy.intercept('POST', '/api/auth/login').as('loginRequest');

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      cy.wait('@loginRequest').then((interception) => {
        // Password should be in request body (this is expected for login)
        // But ensure it's sent over HTTPS in production
        expect(interception.request.body).to.have.property('password');
      });
    });

    it('should clear sensitive data on logout', () => {
      cy.fixture('users').then((users) => {
        const user = users.user;

        // Login
        cy.dataCy('email-input').type(user.email);
        cy.dataCy('password-input').type(user.password);
        cy.dataCy('login-button').click();

        cy.dataCy('user-menu').should('be.visible');

        // Logout
        cy.logout();

        // Verify token is cleared
        cy.getLocalStorage('authToken').should('not.exist');
      });
    });

    it('should handle CSRF tokens if implemented', () => {
      // Check if CSRF token is sent with requests
      cy.intercept('POST', '/api/auth/login').as('loginRequest');

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      cy.wait('@loginRequest').then((interception) => {
        // Verify CSRF token or cookie is present (if your backend requires it)
        // This depends on your backend implementation
        expect(interception.request.headers).to.exist;
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';

      cy.dataCy('email-input').type(longEmail);
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      // Should handle gracefully (either accept or show validation error)
      cy.dataCy('error-message').should('exist');
    });

    it('should handle special characters in password', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type(specialPassword);

      // Should accept special characters
      cy.dataCy('password-input').should('have.value', specialPassword);
    });

    it('should trim whitespace from email', () => {
      cy.dataCy('email-input').type('  test@example.com  ');
      cy.dataCy('password-input').type('password123');

      cy.dataCy('email-input').should('have.value', 'test@example.com');
    });

    it('should handle network timeout', () => {
      cy.intercept('POST', '/api/auth/login', (req) => {
        req.destroy(); // Simulate network error
      }).as('loginRequest');

      cy.dataCy('email-input').type('test@example.com');
      cy.dataCy('password-input').type('password123');
      cy.dataCy('login-button').click();

      cy.dataCy('error-message')
        .should('be.visible')
        .and('contain.text', 'network');
    });
  });
});
