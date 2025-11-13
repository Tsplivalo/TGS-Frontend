import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart';
import { ProductDTO } from '../../models/product/product.model';

describe('CartService', () => {
  let service: CartService;

  const mockProduct: ProductDTO = {
    id: 1,
    description: 'Test Product',
    price: 100,
    stock: 10,
    imageUrl: 'test-image.jpg',
    detail: 'Test details',
    isIllegal: false
  };

  const mockProduct2: ProductDTO = {
    id: 2,
    description: 'Another Product',
    price: 200,
    stock: 20,
    imageUrl: 'test-image2.jpg',
    detail: 'Test details 2',
    isIllegal: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartService]
    });
    service = TestBed.inject(CartService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty cart', () => {
      expect(service.items()).toEqual([]);
    });

    it('should initialize with count 0', () => {
      expect(service.count()).toBe(0);
    });

    it('should initialize with total 0', () => {
      expect(service.total()).toBe(0);
    });

    it('should load cart from localStorage if exists', () => {
      const savedCart: CartItem[] = [
        { id: 1, description: 'Product 1', price: 100, qty: 2, imageUrl: null }
      ];
      localStorage.setItem('cart.v1', JSON.stringify(savedCart));

      // Create new service instance to test loading
      const newService = new CartService();

      expect(newService.items()).toEqual(savedCart);
      expect(newService.count()).toBe(2);
      expect(newService.total()).toBe(200);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('cart.v1', 'invalid json data');

      // Create new service instance
      const newService = new CartService();

      expect(newService.items()).toEqual([]);
    });
  });

  describe('add()', () => {
    it('should add new product to cart', () => {
      service.add(mockProduct);

      expect(service.items().length).toBe(1);
      expect(service.items()[0]).toEqual({
        id: 1,
        description: 'Test Product',
        price: 100,
        imageUrl: 'test-image.jpg',
        qty: 1
      });
    });

    it('should increment quantity if product already exists', () => {
      service.add(mockProduct);
      service.add(mockProduct);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].qty).toBe(2);
    });

    it('should add multiple different products', () => {
      service.add(mockProduct);
      service.add(mockProduct2);

      expect(service.items().length).toBe(2);
    });

    it('should persist cart to localStorage when adding', () => {
      service.add(mockProduct);

      const stored = localStorage.getItem('cart.v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe(1);
    });

    it('should update count when adding products', () => {
      expect(service.count()).toBe(0);

      service.add(mockProduct);
      expect(service.count()).toBe(1);

      service.add(mockProduct);
      expect(service.count()).toBe(2);
    });

    it('should update total when adding products', () => {
      expect(service.total()).toBe(0);

      service.add(mockProduct); // 100
      expect(service.total()).toBe(100);

      service.add(mockProduct); // +100
      expect(service.total()).toBe(200);

      service.add(mockProduct2); // +200
      expect(service.total()).toBe(400);
    });

    it('should handle product with null description', () => {
      const productNoDesc: ProductDTO = {
        ...mockProduct,
        description: null as any
      };

      service.add(productNoDesc);

      expect(service.items()[0].description).toBe('Producto 1');
    });

    it('should handle product with undefined imageUrl', () => {
      const productNoImage: ProductDTO = {
        ...mockProduct,
        imageUrl: undefined
      };

      service.add(productNoImage);

      expect(service.items()[0].imageUrl).toBeNull();
    });
  });

  describe('remove()', () => {
    beforeEach(() => {
      service.add(mockProduct);
      service.add(mockProduct2);
    });

    it('should remove product from cart by id', () => {
      expect(service.items().length).toBe(2);

      service.remove(1);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].id).toBe(2);
    });

    it('should persist cart to localStorage when removing', () => {
      service.remove(1);

      const stored = localStorage.getItem('cart.v1');
      const parsed = JSON.parse(stored!);

      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe(2);
    });

    it('should update count when removing products', () => {
      expect(service.count()).toBe(2);

      service.remove(1);

      expect(service.count()).toBe(1);
    });

    it('should update total when removing products', () => {
      expect(service.total()).toBe(300); // 100 + 200

      service.remove(1); // Remove first product (100)

      expect(service.total()).toBe(200);
    });

    it('should do nothing if removing non-existent product', () => {
      const initialLength = service.items().length;

      service.remove(999);

      expect(service.items().length).toBe(initialLength);
    });
  });

  describe('dec()', () => {
    it('should decrement product quantity', () => {
      service.add(mockProduct);
      service.add(mockProduct); // qty = 2

      expect(service.items()[0].qty).toBe(2);

      service.dec(1);

      expect(service.items()[0].qty).toBe(1);
    });

    it('should remove product if quantity reaches 0', () => {
      service.add(mockProduct); // qty = 1

      service.dec(1);

      expect(service.items().length).toBe(0);
    });

    it('should not allow negative quantities', () => {
      service.add(mockProduct); // qty = 1

      service.dec(1);
      service.dec(1); // Try to go below 0

      expect(service.items().length).toBe(0);
    });

    it('should persist cart when decrementing', () => {
      service.add(mockProduct);
      service.add(mockProduct);

      service.dec(1);

      const stored = localStorage.getItem('cart.v1');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].qty).toBe(1);
    });

    it('should update count when decrementing', () => {
      service.add(mockProduct);
      service.add(mockProduct); // count = 2

      service.dec(1);

      expect(service.count()).toBe(1);
    });

    it('should update total when decrementing', () => {
      service.add(mockProduct);
      service.add(mockProduct); // total = 200

      service.dec(1);

      expect(service.total()).toBe(100);
    });
  });

  describe('inc()', () => {
    beforeEach(() => {
      service.add(mockProduct);
    });

    it('should increment product quantity', () => {
      expect(service.items()[0].qty).toBe(1);

      service.inc(1);

      expect(service.items()[0].qty).toBe(2);
    });

    it('should persist cart when incrementing', () => {
      service.inc(1);

      const stored = localStorage.getItem('cart.v1');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].qty).toBe(2);
    });

    it('should update count when incrementing', () => {
      expect(service.count()).toBe(1);

      service.inc(1);

      expect(service.count()).toBe(2);
    });

    it('should update total when incrementing', () => {
      expect(service.total()).toBe(100);

      service.inc(1);

      expect(service.total()).toBe(200);
    });

    it('should do nothing if incrementing non-existent product', () => {
      const initialCount = service.count();

      service.inc(999);

      expect(service.count()).toBe(initialCount);
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      service.add(mockProduct);
      service.add(mockProduct2);
    });

    it('should clear all items from cart', () => {
      expect(service.items().length).toBe(2);

      service.clear();

      expect(service.items().length).toBe(0);
    });

    it('should reset count to 0', () => {
      expect(service.count()).toBeGreaterThan(0);

      service.clear();

      expect(service.count()).toBe(0);
    });

    it('should reset total to 0', () => {
      expect(service.total()).toBeGreaterThan(0);

      service.clear();

      expect(service.total()).toBe(0);
    });

    it('should persist empty cart to localStorage', () => {
      service.clear();

      const stored = localStorage.getItem('cart.v1');
      const parsed = JSON.parse(stored!);

      expect(parsed).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    it('should calculate correct count for multiple items', () => {
      service.add(mockProduct); // qty 1
      service.add(mockProduct); // qty 2
      service.add(mockProduct2); // qty 1

      expect(service.count()).toBe(3);
    });

    it('should calculate correct total for multiple items', () => {
      service.add(mockProduct); // 100
      service.add(mockProduct); // 200
      service.add(mockProduct2); // 400

      expect(service.total()).toBe(400);
    });

    it('should react to changes in items', () => {
      service.add(mockProduct);
      const initialCount = service.count();
      const initialTotal = service.total();

      service.inc(1);

      expect(service.count()).toBe(initialCount + 1);
      expect(service.total()).toBe(initialTotal + 100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large quantities', () => {
      service.add(mockProduct);

      for (let i = 0; i < 100; i++) {
        service.inc(1);
      }

      expect(service.items()[0].qty).toBe(101);
      expect(service.total()).toBe(10100);
    });

    it('should handle products with price 0', () => {
      const freeProduct: ProductDTO = {
        ...mockProduct,
        price: 0
      };

      service.add(freeProduct);

      expect(service.total()).toBe(0);
    });

    it('should handle empty product description', () => {
      const productEmptyDesc: ProductDTO = {
        ...mockProduct,
        description: ''
      };

      service.add(productEmptyDesc);

      // Empty string is truthy, so it keeps the empty description
      expect(service.items()[0].description).toBe('');
    });
  });
});
