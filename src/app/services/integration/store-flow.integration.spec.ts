import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from '../product/product';
import { CartService, CartItem } from '../cart/cart';
import { ProductDTO, ApiResponse } from '../../models/product/product.model';

/**
 * Integration Tests: Store Flow (Product → Cart → Checkout)
 *
 * These tests verify the complete e-commerce flow from browsing products,
 * adding to cart, managing quantities, calculating totals, to checkout preparation.
 */
describe('Store Flow Integration Tests', () => {
  let productService: ProductService;
  let cartService: CartService;
  let httpMock: HttpTestingController;

  const mockProduct1: ProductDTO = {
    id: 1,
    description: 'Whisky Premium',
    price: 5000,
    stock: 10,
    imageUrl: 'whisky.jpg',
    detail: 'Premium whisky',
    isIllegal: false
  };

  const mockProduct2: ProductDTO = {
    id: 2,
    description: 'Wine Malbec',
    price: 3000,
    stock: 20,
    imageUrl: 'wine.jpg',
    detail: 'Argentine wine',
    isIllegal: false
  };

  const mockProduct3: ProductDTO = {
    id: 3,
    description: 'Vodka Imported',
    price: 4500,
    stock: 15,
    imageUrl: 'vodka.jpg',
    detail: 'Imported vodka',
    isIllegal: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService, CartService]
    });

    productService = TestBed.inject(ProductService);
    cartService = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
    cartService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Complete Shopping Flow', () => {
    it('should browse products, add to cart, and calculate totals', fakeAsync(() => {
      // Step 1: Fetch product list
      productService.getAllProducts().subscribe(products => {
        expect(products.length).toBe(3);

        // Step 2: Add products to cart
        cartService.add(products[0]); // Whisky: 5000
        cartService.add(products[1]); // Wine: 3000
        cartService.add(products[0]); // Whisky again: +5000

        // Step 3: Verify cart state
        expect(cartService.items().length).toBe(2);
        expect(cartService.count()).toBe(3); // 2 whisky + 1 wine
        expect(cartService.total()).toBe(13000); // (5000*2) + 3000
      });

      const req = httpMock.expectOne(req => req.url === '/api/products');
      req.flush({
        success: true,
        message: 'Products retrieved',
        data: [mockProduct1, mockProduct2, mockProduct3]
      });

      tick();
      flush();
    }));

    it('should fetch product details and add to cart', fakeAsync(() => {
      // Step 1: Get specific product
      productService.getProduct(1).subscribe(product => {
        expect(product.id).toBe(1);

        // Step 2: Add to cart
        cartService.add(product);

        // Step 3: Verify cart
        expect(cartService.items().length).toBe(1);
        expect(cartService.items()[0].id).toBe(1);
        expect(cartService.items()[0].price).toBe(5000);
      });

      const req = httpMock.expectOne('/api/products/1');
      req.flush({
        success: true,
        message: 'Product retrieved',
        data: mockProduct1
      });

      tick();
      flush();
    }));
  });

  describe('Cart Management Integration', () => {
    it('should manage cart quantities and update totals', () => {
      // Add products
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);

      expect(cartService.count()).toBe(2);
      expect(cartService.total()).toBe(8000); // 5000 + 3000

      // Increment product 1
      cartService.inc(1);
      expect(cartService.count()).toBe(3);
      expect(cartService.total()).toBe(13000); // (5000*2) + 3000

      // Decrement product 1
      cartService.dec(1);
      expect(cartService.count()).toBe(2);
      expect(cartService.total()).toBe(8000); // 5000 + 3000
    });

    it('should remove products from cart and recalculate', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);
      cartService.add(mockProduct3);

      expect(cartService.items().length).toBe(3);
      expect(cartService.total()).toBe(12500); // 5000 + 3000 + 4500

      // Remove product 2
      cartService.remove(2);
      expect(cartService.items().length).toBe(2);
      expect(cartService.total()).toBe(9500); // 5000 + 4500
    });

    it('should handle cart persistence across operations', () => {
      // Add products
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);

      // Verify persistence
      const stored = localStorage.getItem('cart.v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(2);
      expect(parsed[0].id).toBe(2); // Most recent first (unshift)
      expect(parsed[1].id).toBe(1);
    });

    it('should clear entire cart', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);
      cartService.add(mockProduct3);

      expect(cartService.items().length).toBe(3);

      cartService.clear();

      expect(cartService.items().length).toBe(0);
      expect(cartService.count()).toBe(0);
      expect(cartService.total()).toBe(0);

      const stored = localStorage.getItem('cart.v1');
      expect(JSON.parse(stored!)).toEqual([]);
    });
  });

  describe('Product to Cart Flow', () => {
    it('should add same product multiple times and merge quantities', () => {
      cartService.add(mockProduct1);
      expect(cartService.items().length).toBe(1);
      expect(cartService.items()[0].qty).toBe(1);

      cartService.add(mockProduct1);
      expect(cartService.items().length).toBe(1); // Still 1 item
      expect(cartService.items()[0].qty).toBe(2); // Quantity increased

      cartService.add(mockProduct1);
      expect(cartService.items()[0].qty).toBe(3);
    });

    it('should handle products with null/undefined imageUrl', () => {
      const productNoImage: ProductDTO = {
        ...mockProduct1,
        imageUrl: undefined
      };

      cartService.add(productNoImage);

      expect(cartService.items()[0].imageUrl).toBeNull();
    });

    it('should handle products with null description', () => {
      const productNoDesc: ProductDTO = {
        ...mockProduct1,
        description: null as any
      };

      cartService.add(productNoDesc);

      expect(cartService.items()[0].description).toBe('Producto 1');
    });

    it('should maintain correct order when adding multiple products', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);
      cartService.add(mockProduct3);

      const items = cartService.items();
      // Items are added with unshift, so newest first
      expect(items[0].id).toBe(3);
      expect(items[1].id).toBe(2);
      expect(items[2].id).toBe(1);
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate total for single item with multiple quantities', () => {
      cartService.add(mockProduct1);
      expect(cartService.total()).toBe(5000);

      cartService.inc(1);
      expect(cartService.total()).toBe(10000);

      cartService.inc(1);
      expect(cartService.total()).toBe(15000);
    });

    it('should calculate total for multiple different items', () => {
      cartService.add(mockProduct1); // 5000
      cartService.add(mockProduct2); // 3000
      cartService.add(mockProduct3); // 4500

      expect(cartService.total()).toBe(12500);
    });

    it('should calculate count correctly across all items', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct1); // qty = 2
      cartService.add(mockProduct2);
      cartService.add(mockProduct3);
      cartService.add(mockProduct3); // qty = 2

      expect(cartService.count()).toBe(5); // 2 + 1 + 2
    });

    it('should handle zero total for empty cart', () => {
      expect(cartService.total()).toBe(0);
      expect(cartService.count()).toBe(0);
    });

    it('should update totals when removing items', () => {
      cartService.add(mockProduct1); // 5000
      cartService.add(mockProduct2); // 3000
      cartService.add(mockProduct3); // 4500

      expect(cartService.total()).toBe(12500);

      cartService.remove(2); // Remove wine
      expect(cartService.total()).toBe(9500);

      cartService.remove(3); // Remove vodka
      expect(cartService.total()).toBe(5000);
    });
  });

  describe('Stock Validation Preparation', () => {
    it('should prepare cart data for stock validation', fakeAsync(() => {
      // Get products with stock info
      productService.getAllProducts().subscribe(products => {
        // Add products to cart
        cartService.add(products[0]);
        cartService.inc(1);
        cartService.inc(1); // 3 units

        // Verify cart doesn't exceed stock
        const cartItem = cartService.items().find(i => i.id === 1);
        expect(cartItem?.qty).toBe(3);
        expect(cartItem!.qty).toBeLessThanOrEqual(products[0].stock);
      });

      const req = httpMock.expectOne(req => req.url === '/api/products');
      req.flush({
        success: true,
        message: 'Products retrieved',
        data: [mockProduct1, mockProduct2, mockProduct3]
      });

      tick();
      flush();
    }));

    it('should identify when cart quantity approaches stock limit', fakeAsync(() => {
      productService.getProduct(1).subscribe(product => {
        // Add 8 units (stock is 10)
        cartService.add(product);
        for (let i = 0; i < 7; i++) {
          cartService.inc(1);
        }

        const cartItem = cartService.items()[0];
        expect(cartItem.qty).toBe(8);

        // Could add check for "low stock" warning
        const stockRemaining = product.stock - cartItem.qty;
        expect(stockRemaining).toBe(2);
        expect(stockRemaining).toBeLessThan(5); // Low stock threshold
      });

      const req = httpMock.expectOne('/api/products/1');
      req.flush({
        success: true,
        message: 'Product retrieved',
        data: mockProduct1
      });

      tick();
      flush();
    }));
  });

  describe('Checkout Preparation', () => {
    it('should prepare cart data for checkout', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);
      cartService.inc(1); // 2x whisky

      const checkoutData = {
        items: cartService.items().map(item => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price,
          subtotal: item.price * item.qty
        })),
        total: cartService.total(),
        itemCount: cartService.count()
      };

      expect(checkoutData.items.length).toBe(2);
      expect(checkoutData.total).toBe(13000); // (5000*2) + 3000
      expect(checkoutData.itemCount).toBe(3);

      // Verify individual item calculations
      const whiskyItem = checkoutData.items.find(i => i.productId === 1);
      expect(whiskyItem?.subtotal).toBe(10000);

      const wineItem = checkoutData.items.find(i => i.productId === 2);
      expect(wineItem?.subtotal).toBe(3000);
    });

    it('should handle empty cart checkout attempt', () => {
      const checkoutData = {
        items: cartService.items(),
        total: cartService.total(),
        itemCount: cartService.count()
      };

      expect(checkoutData.items.length).toBe(0);
      expect(checkoutData.total).toBe(0);
      expect(checkoutData.itemCount).toBe(0);
    });

    it('should persist cart state during checkout preparation', () => {
      cartService.add(mockProduct1);
      cartService.add(mockProduct2);

      // Simulate reading cart for checkout
      const stored = localStorage.getItem('cart.v1');
      const cartFromStorage = JSON.parse(stored!) as CartItem[];

      expect(cartFromStorage.length).toBe(2);

      // Verify cart service and storage are in sync
      expect(cartService.items().length).toBe(cartFromStorage.length);
      expect(cartService.items()[0].id).toBe(cartFromStorage[0].id);
    });
  });

  describe('Product Service Error Handling in Cart Flow', () => {
    it('should handle product fetch error gracefully', fakeAsync(() => {
      productService.getAllProducts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);

          // Cart should remain empty
          expect(cartService.items().length).toBe(0);
        }
      });

      const req = httpMock.expectOne(req => req.url === '/api/products');
      req.flush(
        { success: false, message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      tick();
      flush();
    }));

    it('should handle product not found when adding to cart', fakeAsync(() => {
      productService.getProduct(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);

          // Cart should not have the non-existent product
          expect(cartService.items().length).toBe(0);
        }
      });

      const req = httpMock.expectOne('/api/products/999');
      req.flush(
        { success: false, message: 'Product not found' },
        { status: 404, statusText: 'Not Found' }
      );

      tick();
      flush();
    }));
  });

  describe('Cart Persistence and Recovery', () => {
    it('should restore cart from localStorage on service initialization', () => {
      // Setup cart data in localStorage
      const savedCart: CartItem[] = [
        {
          id: 1,
          description: 'Saved Product',
          price: 1000,
          qty: 2,
          imageUrl: 'image.jpg'
        }
      ];
      localStorage.setItem('cart.v1', JSON.stringify(savedCart));

      // Create new service instance
      const newCartService = new CartService();

      expect(newCartService.items()).toEqual(savedCart);
      expect(newCartService.count()).toBe(2);
      expect(newCartService.total()).toBe(2000);
    });

    it('should handle corrupted cart data in localStorage', () => {
      localStorage.setItem('cart.v1', 'invalid json {]');

      // Should not throw error
      const newCartService = new CartService();

      expect(newCartService.items()).toEqual([]);
      expect(newCartService.count()).toBe(0);
    });

    it('should handle missing cart data in localStorage', () => {
      localStorage.removeItem('cart.v1');

      const newCartService = new CartService();

      expect(newCartService.items()).toEqual([]);
    });
  });

  describe('Complex Shopping Scenarios', () => {
    it('should handle bulk purchase flow', () => {
      // Add 5 units of product 1
      for (let i = 0; i < 5; i++) {
        cartService.add(mockProduct1);
      }

      expect(cartService.items().length).toBe(1);
      expect(cartService.items()[0].qty).toBe(5);
      expect(cartService.total()).toBe(25000); // 5000 * 5
    });

    it('should handle mixed increment and decrement operations', () => {
      cartService.add(mockProduct1);

      cartService.inc(1); // 2
      cartService.inc(1); // 3
      cartService.inc(1); // 4
      cartService.dec(1); // 3
      cartService.dec(1); // 2

      expect(cartService.items()[0].qty).toBe(2);
      expect(cartService.total()).toBe(10000);
    });

    it('should handle add, remove, and re-add same product', () => {
      cartService.add(mockProduct1);
      expect(cartService.items().length).toBe(1);

      cartService.remove(1);
      expect(cartService.items().length).toBe(0);

      cartService.add(mockProduct1);
      expect(cartService.items().length).toBe(1);
      expect(cartService.items()[0].qty).toBe(1); // Fresh start
    });

    it('should handle updating quantities to zero removes item', () => {
      cartService.add(mockProduct1);
      expect(cartService.items().length).toBe(1);

      cartService.dec(1);
      expect(cartService.items().length).toBe(0);
    });
  });
});
