import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from '../product/product';
import { CartService, CartItem, CartOfferInput } from '../cart/cart';
import { ProductDTO } from '../../models/product/product.model';

/**
 * Integration Tests: Store Flow (Product → Offer → Cart → Checkout)
 *
 * En el marketplace el carrito es "distributor-aware": cada ítem es una OFERTA
 * (producto + distribuidor). Estos tests verifican el flujo completo: traer
 * productos, agregarlos como ofertas, manejar cantidades, totales, agrupación
 * por distribuidor y preparación del checkout (un payload por distribuidor).
 */
describe('Store Flow Integration Tests', () => {
  let productService: ProductService;
  let cartService: CartService;
  let httpMock: HttpTestingController;

  const STORAGE_KEY = 'cart.marketplace.v1';

  const mockProduct1: ProductDTO = {
    id: 1, description: 'Whisky Premium', price: 5000, stock: 10,
    imageUrl: 'whisky.jpg', detail: 'Premium whisky', isIllegal: false,
  };
  const mockProduct2: ProductDTO = {
    id: 2, description: 'Wine Malbec', price: 3000, stock: 20,
    imageUrl: 'wine.jpg', detail: 'Argentine wine', isIllegal: false,
  };
  const mockProduct3: ProductDTO = {
    id: 3, description: 'Vodka Imported', price: 4500, stock: 15,
    imageUrl: 'vodka.jpg', detail: 'Imported vodka', isIllegal: false,
  };

  /** Convierte un producto en una oferta de un distribuidor (como hace el store). */
  const asOffer = (p: ProductDTO, dni = 'D1', name = 'Dist 1'): CartOfferInput => ({
    offerId: `${p.id}-${dni}`,
    productId: p.id,
    distributorDni: dni,
    distributorName: name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl ?? null,
    zone: { id: 1, name: 'Zona 1' },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService, CartService],
    });
    productService = TestBed.inject(ProductService);
    cartService = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
    cartService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Complete Shopping Flow', () => {
    it('trae productos, los agrega como ofertas y calcula totales', fakeAsync(() => {
      productService.getAllProducts().subscribe(products => {
        expect(products.length).toBe(3);
        cartService.add(asOffer(products[0])); // 5000
        cartService.add(asOffer(products[1])); // 3000
        cartService.add(asOffer(products[0])); // +5000 (misma oferta => qty 2)

        expect(cartService.items().length).toBe(2);
        expect(cartService.count()).toBe(3);
        expect(cartService.total()).toBe(13000);
      });

      const req = httpMock.expectOne((request) => {
        const url = new URL(request.url, 'http://localhost');
        return url.pathname === '/api/products' && request.method === 'GET';
      });
      req.flush({ success: true, message: 'ok', data: [mockProduct1, mockProduct2, mockProduct3] });
      tick(); flush();
    }));

    it('trae un producto puntual y lo agrega al carrito', fakeAsync(() => {
      productService.getProduct(1).subscribe(product => {
        expect(product.id).toBe(1);
        cartService.add(asOffer(product));
        expect(cartService.items().length).toBe(1);
        expect(cartService.items()[0].productId).toBe(1);
        expect(cartService.items()[0].price).toBe(5000);
      });

      httpMock.expectOne('/api/products/1').flush({ success: true, message: 'ok', data: mockProduct1 });
      tick(); flush();
    }));
  });

  describe('Cart Management Integration', () => {
    it('maneja cantidades y actualiza totales', () => {
      cartService.add(asOffer(mockProduct1));
      cartService.add(asOffer(mockProduct2));
      expect(cartService.count()).toBe(2);
      expect(cartService.total()).toBe(8000);

      cartService.inc('1-D1');
      expect(cartService.total()).toBe(13000);

      cartService.dec('1-D1');
      expect(cartService.total()).toBe(8000);
    });

    it('elimina ofertas y recalcula', () => {
      cartService.add(asOffer(mockProduct1));
      cartService.add(asOffer(mockProduct2));
      cartService.add(asOffer(mockProduct3));
      expect(cartService.total()).toBe(12500);

      cartService.remove('2-D1');
      expect(cartService.items().length).toBe(2);
      expect(cartService.total()).toBe(9500);
    });

    it('persiste el carrito', () => {
      cartService.add(asOffer(mockProduct1));
      cartService.add(asOffer(mockProduct2));
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as CartItem[];
      expect(parsed.length).toBe(2);
      expect(parsed.map(i => i.offerId).sort()).toEqual(['1-D1', '2-D1']);
    });

    it('vacía el carrito', () => {
      cartService.add(asOffer(mockProduct1));
      cartService.add(asOffer(mockProduct2));
      cartService.clear();
      expect(cartService.count()).toBe(0);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
    });
  });

  describe('Checkout por distribuidor (#9 / #11)', () => {
    it('agrupa por distribuidor y arma un payload por cada uno', () => {
      // Producto 1 del distribuidor A, producto 2 del distribuidor B
      cartService.add(asOffer(mockProduct1, 'A', 'Dist A'));
      cartService.add(asOffer(mockProduct1, 'A', 'Dist A')); // qty 2
      cartService.add(asOffer(mockProduct2, 'B', 'Dist B'));

      const groups = cartService.distributorGroups();
      expect(groups.length).toBe(2);
      expect(cartService.hasMultipleDistributors()).toBeTrue();

      const payloads = cartService.buildSalePayloads('CLI-1');
      expect(payloads.map(p => p.distributorDni).sort()).toEqual(['A', 'B']);
      expect(payloads.find(p => p.distributorDni === 'A')!.details).toEqual([
        { productId: 1, quantity: 2 },
      ]);
      expect(payloads.find(p => p.distributorDni === 'B')!.details).toEqual([
        { productId: 2, quantity: 1 },
      ]);
    });

    it('mismo producto de dos distribuidores => dos ofertas distintas', () => {
      cartService.add(asOffer(mockProduct1, 'A', 'Dist A'));
      cartService.add(asOffer(mockProduct1, 'B', 'Dist B'));
      expect(cartService.items().length).toBe(2);
      expect(cartService.distributorGroups().length).toBe(2);
    });
  });

  describe('Cart Persistence and Recovery', () => {
    it('restaura el carrito desde localStorage al iniciar', () => {
      const saved: CartItem[] = [{ ...asOffer(mockProduct1), qty: 2 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const fresh = new CartService();
      expect(fresh.items()).toEqual(saved);
      expect(fresh.count()).toBe(2);
      expect(fresh.total()).toBe(10000);
    });

    it('tolera datos corruptos', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {]');
      expect(new CartService().items()).toEqual([]);
    });
  });

  describe('Product Service Error Handling in Cart Flow', () => {
    it('maneja error al traer productos y deja el carrito vacío', fakeAsync(() => {
      productService.getAllProducts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(cartService.items().length).toBe(0);
        },
      });

      const req = httpMock.expectOne((request) => {
        const url = new URL(request.url, 'http://localhost');
        return url.pathname === '/api/products' && request.method === 'GET';
      });
      req.flush({ success: false, message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
      tick(); flush();
    }));
  });
});
