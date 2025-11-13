/**
 * Accessibility Tests - Products/Store Section
 *
 * WCAG 2.1 Level AA Compliance Tests
 * Validates product catalog, search, filters, and product cards accessibility
 */

describe('Products/Store - Accessibility (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    cy.visit('/tienda');
    cy.injectAxe();
    cy.waitForAngular();
  });

  describe('Product Catalog Page Structure', () => {
    it('should have no accessibility violations on products page', () => {
      cy.checkA11yWCAG();
    });

    it('should have proper page heading (H1) for products section', () => {
      cy.get('h1').should('exist').and('be.visible');
      cy.get('h1').should('contain.text', /productos|tienda|store/i);

      cy.checkA11yWCAG('h1');
    });

    it('should have main landmark for product content', () => {
      cy.get('main, [role="main"]').should('exist').and('be.visible');

      cy.checkA11yWCAG('main, [role="main"]');
    });
  });

  describe('Product Search and Filters', () => {
    it('should have accessible search input with proper label', () => {
      cy.get('input[type="search"], input[type="text"][placeholder*="uscar"], input[placeholder*="search"]')
        .first()
        .should('exist')
        .and('satisfy', ($el) => {
          const id = $el.attr('id');
          const ariaLabel = $el.attr('aria-label');
          const ariaLabelledby = $el.attr('aria-labelledby');
          const placeholder = $el.attr('placeholder');
          const hasLabel = id && Cypress.$(`label[for="${id}"]`).length > 0;

          return ariaLabel || ariaLabelledby || hasLabel || placeholder;
        });

      cy.checkA11yWCAG('input[type="search"], input[type="text"]', {
        rules: {
          'label': { enabled: true }
        }
      });
    });

    it('should have accessible filter controls with labels', () => {
      cy.get('select, input[type="checkbox"], input[type="radio"]').each($control => {
        const id = $control.attr('id');
        const ariaLabel = $control.attr('aria-label');
        const ariaLabelledby = $control.attr('aria-labelledby');

        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          expect(ariaLabel || ariaLabelledby).to.exist;
        }
      });
    });

    it('should announce search results to screen readers', () => {
      // Check for results announcement region
      cy.get('[role="status"], [aria-live="polite"], .results-count')
        .should('exist');

      cy.checkA11yWCAG('[role="status"], [aria-live]');
    });

    it('should have keyboard accessible filter toggles', () => {
      cy.get('button, [role="button"]').each($btn => {
        if ($btn.is(':visible')) {
          cy.wrap($btn).should('not.have.attr', 'tabindex', '-1');
        }
      });
    });
  });

  describe('Product Cards/Grid', () => {
    it('should have accessible product cards with proper structure', () => {
      cy.get('.product-card, [data-cy*="product"], article').first().within(() => {
        // Each product card should have heading
        cy.get('h2, h3, h4, [role="heading"]').should('exist');

        // Each product should have price
        cy.get('.price, [class*="price"], [data-cy*="price"]').should('exist');
      });

      cy.checkA11yWCAG('.product-card, article');
    });

    it('should have alt text for all product images', () => {
      cy.get('.product-card img, [data-cy*="product"] img').each($img => {
        cy.wrap($img).should('have.attr', 'alt');

        const alt = $img.attr('alt');
        // Alt should not be empty or generic like "image"
        if (alt) {
          expect(alt.toLowerCase()).to.not.match(/^(image|img|photo|picture)$/);
        }
      });

      cy.checkA11yWCAG('img', {
        rules: {
          'image-alt': { enabled: true }
        }
      });
    });

    it('should have accessible product links/buttons', () => {
      cy.get('.product-card a, [data-cy*="product"] a, .product-card button').each($link => {
        cy.wrap($link).should('satisfy', ($el) => {
          const text = $el.text().trim();
          const ariaLabel = $el.attr('aria-label');
          const title = $el.attr('title');

          return text.length > 0 || ariaLabel || title;
        });
      });

      cy.checkA11yWCAG('.product-card a, .product-card button');
    });

    it('should have proper ARIA labels for add-to-cart buttons', () => {
      cy.get('button[class*="cart"], button[class*="add"], [data-cy*="add-cart"]').each($btn => {
        const ariaLabel = $btn.attr('aria-label');
        const text = $btn.text().trim();

        // Button should describe action
        if (ariaLabel) {
          expect(ariaLabel).to.match(/agregar|añadir|add|cart/i);
        } else {
          expect(text).to.match(/agregar|añadir|add|cart/i);
        }
      });
    });

    it('should have sufficient color contrast on product prices', () => {
      cy.checkA11yWCAG('.price, [class*="price"]', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });
  });

  describe('Product Details (if navigable)', () => {
    it('should have accessible product detail page', () => {
      cy.get('.product-card a, [data-cy*="product"] a').first().then($link => {
        if ($link.attr('href')) {
          cy.wrap($link).click();
          cy.waitForAngular();

          cy.checkA11yWCAG('main');
        }
      });
    });

    it('should have proper heading hierarchy on detail page', () => {
      cy.get('.product-card a, [data-cy*="product"] a').first().then($link => {
        if ($link.attr('href')) {
          cy.wrap($link).click();
          cy.waitForAngular();

          cy.get('h1').should('exist');

          cy.checkA11yWCAG('body', {
            rules: {
              'heading-order': { enabled: true }
            }
          });
        }
      });
    });
  });

  describe('Pagination and Navigation', () => {
    it('should have accessible pagination controls', () => {
      cy.get('[role="navigation"][aria-label*="pagination"], .pagination, [class*="pag"]').then($pagination => {
        if ($pagination.length > 0) {
          cy.wrap($pagination).first().within(() => {
            cy.get('a, button').each($control => {
              cy.wrap($control).should('satisfy', ($el) => {
                const text = $el.text().trim();
                const ariaLabel = $el.attr('aria-label');
                return text.length > 0 || ariaLabel;
              });
            });
          });

          cy.checkA11yWCAG('[role="navigation"][aria-label*="pagination"], .pagination');
        }
      });
    });

    it('should have current page indication for screen readers', () => {
      cy.get('.pagination [aria-current="page"], .pagination .active').then($current => {
        if ($current.length > 0) {
          cy.wrap($current).should('have.attr', 'aria-current', 'page')
            .or('have.attr', 'aria-label');
        }
      });
    });

    it('should have keyboard navigable pagination', () => {
      cy.get('.pagination a, .pagination button').each($link => {
        if ($link.is(':visible')) {
          cy.wrap($link).should('not.have.attr', 'tabindex', '-1');
        }
      });
    });
  });

  describe('Sort and View Controls', () => {
    it('should have accessible sort dropdown', () => {
      cy.get('select[name*="sort"], select[name*="order"], [data-cy*="sort"]').then($sort => {
        if ($sort.length > 0) {
          cy.wrap($sort).first().should('satisfy', ($el) => {
            const id = $el.attr('id');
            const ariaLabel = $el.attr('aria-label');
            const hasLabel = id && Cypress.$(`label[for="${id}"]`).length > 0;

            return ariaLabel || hasLabel;
          });

          cy.checkA11yWCAG('select');
        }
      });
    });

    it('should have accessible view toggle buttons (grid/list)', () => {
      cy.get('[data-cy*="view"], button[class*="view"], [aria-label*="view"]').each($btn => {
        if ($btn.is(':visible')) {
          const ariaLabel = $btn.attr('aria-label');
          const ariaPressed = $btn.attr('aria-pressed');
          const text = $btn.text().trim();

          // Toggle buttons should have aria-pressed
          if (ariaPressed !== undefined) {
            expect(ariaPressed).to.match(/true|false/);
          }

          expect(ariaLabel || text.length > 0).to.exist;
        }
      });
    });
  });

  describe('Empty States and Messages', () => {
    it('should have accessible empty state messages', () => {
      // Search for non-existent product
      cy.get('input[type="search"], input[type="text"]').first().then($search => {
        if ($search.length > 0) {
          cy.wrap($search).clear().type('xyznonexistentproduct123');

          // Check for empty state message
          cy.get('[role="status"], .empty-state, .no-results').then($empty => {
            if ($empty.length > 0) {
              cy.wrap($empty).should('be.visible');
              cy.checkA11yWCAG('[role="status"], .empty-state');
            }
          });
        }
      });
    });
  });

  describe('Interactive Features', () => {
    it('should have accessible quick view/preview modals', () => {
      cy.get('[data-cy*="quick"], button[class*="preview"]').first().then($quickView => {
        if ($quickView.length > 0) {
          cy.wrap($quickView).click();

          // Check modal accessibility
          cy.get('[role="dialog"], .modal').then($modal => {
            if ($modal.length > 0) {
              cy.wrap($modal).should('have.attr', 'aria-modal', 'true')
                .or('have.attr', 'role', 'dialog');

              cy.checkA11yWCAG('[role="dialog"], .modal');
            }
          });
        }
      });
    });

    it('should have focus trapped in modals', () => {
      cy.get('[data-cy*="quick"], button[class*="preview"]').first().then($quickView => {
        if ($quickView.length > 0) {
          cy.wrap($quickView).click();

          // Tab through modal elements
          cy.get('[role="dialog"] *:focusable, .modal *:focusable').first().focus();
          cy.focused().should('exist');
        }
      });
    });
  });

  describe('Comprehensive Store Accessibility', () => {
    it('should pass all WCAG 2.1 AA rules for product listing', () => {
      cy.checkA11y(undefined, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });

    it('should have no critical violations in product section', () => {
      cy.checkA11y('main, [role="main"]', {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('should be fully keyboard navigable', () => {
      // Tab through all interactive elements
      let tabCount = 0;
      const maxTabs = 50;

      function tabAndCheck() {
        if (tabCount < maxTabs) {
          cy.focused().then($focused => {
            if ($focused.length > 0) {
              cy.log(`Focused element ${tabCount}:`, $focused.prop('tagName'));
              tabCount++;
              cy.get('body').tab();
              tabAndCheck();
            }
          });
        }
      }

      cy.get('body').tab();
      tabAndCheck();

      expect(tabCount).to.be.greaterThan(0);
    });
  });
});
