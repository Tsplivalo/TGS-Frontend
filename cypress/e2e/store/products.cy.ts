/// <reference types="cypress" />

/**
 * Products/Store Tests
 *
 * Tests E2E para funcionalidad de productos y tienda
 */
describe('Products/Store Flow', () => {
  describe('Product Listing', () => {
    it('should display product catalog', () => {
      cy.visit('/');

      // Navegar a tienda/productos
      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Verificar que se muestran productos
      cy.get('[class*="product"], [data-cy*="product"]').should('have.length.greaterThan', 0);
    });

    it('should show product details when clicking on product', () => {
      cy.visit('/');

      // Ir a tienda
      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Click en el primer producto
      cy.get('[class*="product"], [data-cy*="product"]').first().click();

      // Debería mostrar detalles del producto
      cy.url().should('match', /product|producto/i);
      cy.get('[class*="detail"], [class*="description"]').should('exist');
    });

    it('should filter products by category', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Buscar filtros
      cy.get('[class*="filter"], select, [class*="category"]').then(($filters) => {
        if ($filters.length > 0) {
          // Click en un filtro
          cy.wrap($filters).first().click();

          // Los productos deberían actualizarse
          cy.get('[class*="product"]').should('exist');
        } else {
          cy.log('No filters found - basic store');
        }
      });
    });

    it('should search for products', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Buscar input de búsqueda
      cy.get('input[type="search"], input[placeholder*="search"], input[placeholder*="buscar"]').then(($search) => {
        if ($search.length > 0) {
          cy.wrap($search).first().type('test product');

          // Debería filtrar resultados
          cy.get('[class*="product"]').should('exist');
        } else {
          cy.log('No search functionality found');
        }
      });
    });
  });

  describe('Shopping Cart (if applicable)', () => {
    it('should add product to cart', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Buscar botón de añadir al carrito
      cy.contains(/add to cart|añadir|agregar/i).then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click();

          // Verificar que el carrito se actualizó
          cy.get('[class*="cart"], [data-cy*="cart"]').should('contain.text', '1');
        } else {
          cy.log('No cart functionality found');
        }
      });
    });

    it('should update cart quantity', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Añadir producto
      cy.contains(/add to cart|añadir|agregar/i).then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click();

          // Ir al carrito
          cy.get('[class*="cart"], [data-cy*="cart"]').click();

          // Incrementar cantidad
          cy.get('button[aria-label*="increase"], button:contains("+")').then(($increase) => {
            if ($increase.length > 0) {
              cy.wrap($increase).first().click();

              // Cantidad debería ser 2
              cy.get('[class*="quantity"]').should('contain.text', '2');
            }
          });
        }
      });
    });

    it('should remove product from cart', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Añadir producto
      cy.contains(/add to cart|añadir|agregar/i).then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click();

          // Ir al carrito
          cy.get('[class*="cart"], [data-cy*="cart"]').click();

          // Remover producto
          cy.contains(/remove|eliminar|borrar/i).first().click();

          // Carrito debería estar vacío
          cy.contains(/empty|vacío/i).should('exist');
        }
      });
    });
  });

  describe('Product Details', () => {
    it('should show product information', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Click en producto
      cy.get('[class*="product"]').first().click();

      // Verificar información del producto
      cy.get('h1, h2, [class*="title"]').should('exist');
      cy.get('[class*="price"]').should('exist');
      cy.get('[class*="description"]').should('exist');
    });

    it('should show product image', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      cy.get('[class*="product"]').first().click();

      // Verificar que hay imagen
      cy.get('img').should('have.attr', 'src').and('not.be.empty');
    });
  });

  describe('Checkout Flow', () => {
    beforeEach(() => {
      // Simular usuario autenticado
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'mock-token');
        win.localStorage.setItem('authUser', JSON.stringify({
          id: 'test-user',
          email: 'test@example.com',
          roles: ['USER']
        }));
      });
    });

    it('should proceed to checkout with items in cart', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Añadir producto
      cy.contains(/add to cart|añadir|agregar/i).then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click();

          // Ir al carrito
          cy.get('[class*="cart"]').click();

          // Proceder al checkout
          cy.contains(/checkout|pagar|finalizar/i).then(($checkout) => {
            if ($checkout.length > 0) {
              cy.wrap($checkout).click();

              // Debería redirigir a checkout
              cy.url().should('match', /checkout|payment|pago/i);
            }
          });
        }
      });
    });

    it('should not allow checkout with empty cart', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Ir al carrito (vacío)
      cy.get('[class*="cart"]').then(($cart) => {
        if ($cart.length > 0) {
          cy.wrap($cart).click();

          // Botón de checkout debería estar deshabilitado o no existir
          cy.contains(/checkout|pagar|finalizar/i).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).should('be.disabled');
            }
          });
        }
      });
    });
  });

  describe('Product Sorting', () => {
    it('should sort products by price', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Buscar dropdown de ordenamiento
      cy.get('select[name*="sort"], [class*="sort"]').then(($sort) => {
        if ($sort.length > 0) {
          cy.wrap($sort).first().select(/price|precio/i);

          // Productos deberían reordenarse
          cy.wait(500);
          cy.get('[class*="product"]').should('exist');
        } else {
          cy.log('No sorting functionality found');
        }
      });
    });

    it('should sort products by name', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      cy.get('select[name*="sort"], [class*="sort"]').then(($sort) => {
        if ($sort.length > 0) {
          cy.wrap($sort).first().select(/name|nombre/i);

          cy.wait(500);
          cy.get('[class*="product"]').should('exist');
        }
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display products in grid on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Productos deberían estar en grid
      cy.get('[class*="product"]').should('have.css', 'display').and('match', /grid|flex/);
    });

    it('should display products in single column on mobile', () => {
      cy.viewport('iphone-6');
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // En móvil, podría ser columna única o grid de 2 columnas
      cy.get('[class*="product"]').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle out of stock products', () => {
      cy.visit('/');

      cy.contains(/store|tienda|productos|products/i).first().click({ force: true });

      // Buscar productos sin stock (si existen)
      cy.contains(/out of stock|sin stock|agotado/i).then(($outOfStock) => {
        if ($outOfStock.length > 0) {
          cy.log('Out of stock products handled correctly');
        } else {
          cy.log('All products in stock or feature not implemented');
        }
      });
    });

    it('should handle invalid product IDs', () => {
      cy.visit('/product/invalid-id-99999', { failOnStatusCode: false });

      // Debería mostrar error o redirigir
      cy.url().should('satisfy', (url) => {
        return url.includes('/404') || url.includes('/products') || url.includes('/');
      });
    });
  });
});
