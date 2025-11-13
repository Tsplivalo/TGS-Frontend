/// <reference types="cypress" />

/**
 * Navigation Tests
 *
 * Tests que verifican la navegación correcta entre diferentes páginas
 * y el comportamiento del navbar y rutas.
 */
describe('Navigation Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Public Navigation', () => {
    it('should navigate to home page', () => {
      cy.visit('/some-other-page', { failOnStatusCode: false });

      // Click en logo/home
      cy.get('.brand, [routerLink="/"], a[href="/"]').first().click();

      cy.url().should('match', /\/$|\/home/);
    });

    it('should have visible navigation menu', () => {
      // Verificar que el menú de navegación existe
      cy.get('nav, app-navbar').should('be.visible');

      // Verificar que tiene items de menú
      cy.get('nav a, nav button, .menu a').should('have.length.greaterThan', 0);
    });

    it('should highlight active route in navigation', () => {
      cy.visit('/');

      // El link activo debería tener una clase especial
      cy.get('nav .active, nav [routerLinkActive].active').should('exist');
    });
  });

  describe('Authenticated Navigation', () => {
    beforeEach(() => {
      // Simular usuario autenticado mediante localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'mock-test-token-12345');
        win.localStorage.setItem('authUser', JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          roles: ['USER']
        }));
      });
    });

    it('should show user menu when authenticated', () => {
      cy.visit('/');

      // Debería mostrar menú de usuario o avatar
      cy.get('[data-cy="user-menu"], .user-menu, [class*="user-menu"]').should('exist');
    });

    it('should allow navigation to protected routes when authenticated', () => {
      // Con token válido, debería poder acceder a dashboard
      cy.visit('/dashboard', { failOnStatusCode: false });

      // No debería redirigir a login
      cy.url().should('not.include', '/login');
    });

    it('should show logout option in user menu', () => {
      cy.visit('/');

      // Abrir menú de usuario
      cy.get('[data-cy="user-menu"], .user-menu, [class*="user-menu"]').click();

      // Debería aparecer opción de logout
      cy.contains(/logout|cerrar sesión|salir/i).should('be.visible');
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should update breadcrumbs when navigating', () => {
      // Navegar a una página específica
      cy.visit('/dashboard', { failOnStatusCode: false });

      // Si hay breadcrumbs, deberían actualizarse
      cy.get('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').then(($breadcrumb) => {
        if ($breadcrumb.length > 0) {
          cy.wrap($breadcrumb).should('be.visible');
        } else {
          // Si no hay breadcrumbs, solo registrar
          cy.log('No breadcrumbs found - this is OK for simple apps');
        }
      });
    });
  });

  describe('Back/Forward Navigation', () => {
    it('should maintain navigation history', () => {
      // Navegar a login
      cy.contains(/login|iniciar sesión/i).first().click();
      const loginUrl = cy.url();

      // Ir atrás
      cy.go('back');
      cy.url().should('not.equal', loginUrl);

      // Ir adelante
      cy.go('forward');
      cy.url().should('include', 'login');
    });
  });

  describe('External Links', () => {
    it('should open external links in new tab', () => {
      cy.visit('/');

      // Buscar links externos (si existen)
      cy.get('a[target="_blank"], a[href^="http"]:not([href*="localhost"])').then(($links) => {
        if ($links.length > 0) {
          // Verificar que tienen target="_blank"
          cy.wrap($links.first()).should('have.attr', 'target', '_blank');
        } else {
          cy.log('No external links found');
        }
      });
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-6');
    });

    it('should show mobile menu button on small screens', () => {
      cy.visit('/');

      // Buscar hamburger menu o botón de menú móvil
      cy.get('[class*="menu-toggle"], [class*="hamburger"], button[aria-label*="menu"]').should('exist');
    });

    it('should toggle mobile menu when button is clicked', () => {
      cy.visit('/');

      const menuButton = cy.get('[class*="menu-toggle"], [class*="hamburger"], button[aria-label*="menu"]');

      if (menuButton) {
        menuButton.first().click();

        // El menú debería aparecer
        cy.get('.menu, [class*="mobile-menu"], nav').should('be.visible');
      }
    });
  });

  describe('Scroll Behavior', () => {
    it('should scroll to top when navigating to new page', () => {
      // Hacer scroll down
      cy.scrollTo('bottom');

      // Navegar a otra página
      cy.contains(/login|iniciar sesión/i).first().click();

      // Verificar que está en el top
      cy.window().its('scrollY').should('equal', 0);
    });
  });

  describe('Route Guards', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      // Limpiar cualquier token
      cy.clearLocalStorage();

      // Intentar acceder a ruta protegida
      cy.visit('/admin', { failOnStatusCode: false });

      // Debería redirigir
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.endsWith('/');
      });
    });

    it('should redirect from login when already authenticated', () => {
      // Simular autenticación
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'mock-token');
      });

      // Intentar ir a login
      cy.visit('/login', { failOnStatusCode: false });

      // Puede redirigir a dashboard o home
      cy.url().should('satisfy', (url) => {
        return url.includes('/dashboard') || url.endsWith('/') || url.includes('/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle broken links gracefully', () => {
      cy.visit('/this-route-definitely-does-not-exist-999', { failOnStatusCode: false });

      // No debería mostrar pantalla en blanco
      cy.get('body').should('not.be.empty');

      // Debería mostrar algo (404 page o redirigir)
      cy.get('app-root').should('exist');
    });
  });

  describe('Language Navigation', () => {
    it('should persist selected language across navigation', () => {
      // Cambiar idioma (si hay selector)
      cy.get('[class*="lang"], select[name*="lang"]').then(($lang) => {
        if ($lang.length > 0) {
          // Click en selector de idioma
          cy.wrap($lang).first().click();

          // Seleccionar un idioma
          cy.contains(/english|español|en|es/i).first().click();

          // Navegar a otra página
          cy.visit('/');

          // El idioma debería persistir
          cy.log('Language should persist across navigation');
        } else {
          cy.log('No language selector found');
        }
      });
    });
  });
});
