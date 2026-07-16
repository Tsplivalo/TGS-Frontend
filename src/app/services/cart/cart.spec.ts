import { TestBed } from '@angular/core/testing';
import { CartService, CartItem, CartOfferInput } from './cart';

const STORAGE_KEY = 'cart.marketplace.v1';

/** Oferta del distribuidor A (producto 1). */
const offerA1 = (): CartOfferInput => ({
  offerId: '1-A',
  productId: 1,
  distributorDni: 'A',
  distributorName: 'Dist A',
  description: 'Producto 1',
  price: 100,
  imageUrl: 'img1.jpg',
  zone: { id: 1, name: 'Zona A' },
});

/** Otra oferta del distribuidor A (producto 2). */
const offerA2 = (): CartOfferInput => ({
  offerId: '2-A',
  productId: 2,
  distributorDni: 'A',
  distributorName: 'Dist A',
  description: 'Producto 2',
  price: 50,
  imageUrl: null,
  zone: { id: 1, name: 'Zona A' },
});

/** Oferta del distribuidor B (producto 3). */
const offerB3 = (): CartOfferInput => ({
  offerId: '3-B',
  productId: 3,
  distributorDni: 'B',
  distributorName: 'Dist B',
  description: 'Producto 3',
  price: 200,
  imageUrl: null,
  zone: { id: 2, name: 'Zona B' },
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  describe('Inicialización', () => {
    it('should be created', () => expect(service).toBeTruthy());
    it('empieza vacío', () => expect(service.items()).toEqual([]));
    it('count y total en 0', () => {
      expect(service.count()).toBe(0);
      expect(service.total()).toBe(0);
    });

    it('carga el carrito desde localStorage si existe', () => {
      const saved: CartItem[] = [{ ...offerA1(), qty: 2 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const fresh = new CartService();
      expect(fresh.items()).toEqual(saved);
      expect(fresh.count()).toBe(2);
      expect(fresh.total()).toBe(200);
    });

    it('tolera datos corruptos en localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'no-json');
      expect(new CartService().items()).toEqual([]);
    });
  });

  describe('add()', () => {
    it('agrega una oferta nueva con qty 1', () => {
      service.add(offerA1());
      expect(service.items().length).toBe(1);
      expect(service.items()[0]).toEqual({ ...offerA1(), qty: 1 });
    });

    it('incrementa la cantidad si la oferta ya existe', () => {
      service.add(offerA1());
      service.add(offerA1());
      expect(service.items().length).toBe(1);
      expect(service.items()[0].qty).toBe(2);
    });

    it('agrega ofertas distintas por separado', () => {
      service.add(offerA1());
      service.add(offerA2());
      expect(service.items().length).toBe(2);
    });

    it('persiste en localStorage', () => {
      service.add(offerA1());
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].offerId).toBe('1-A');
    });

    it('actualiza count y total', () => {
      service.add(offerA1()); // 100
      service.add(offerA1()); // +100
      service.add(offerB3()); // +200
      expect(service.count()).toBe(3);
      expect(service.total()).toBe(400);
    });
  });

  describe('inc() / dec() / remove()', () => {
    beforeEach(() => service.add(offerA1()));

    it('inc incrementa la cantidad', () => {
      service.inc('1-A');
      expect(service.items()[0].qty).toBe(2);
    });

    it('dec decrementa la cantidad', () => {
      service.inc('1-A');
      service.dec('1-A');
      expect(service.items()[0].qty).toBe(1);
    });

    it('dec elimina la oferta al llegar a 0 (sin cantidades negativas)', () => {
      service.dec('1-A');
      expect(service.items().length).toBe(0);
      service.dec('1-A'); // no rompe
      expect(service.items().length).toBe(0);
    });

    it('remove elimina la oferta', () => {
      service.add(offerB3());
      service.remove('1-A');
      expect(service.items().map(i => i.offerId)).toEqual(['3-B']);
    });

    it('inc/remove sobre offerId inexistente no hace nada', () => {
      service.inc('nope');
      service.remove('nope');
      expect(service.count()).toBe(1);
    });

    it('persisten los cambios', () => {
      service.inc('1-A');
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].qty).toBe(2);
    });
  });

  describe('clear()', () => {
    it('vacía el carrito y persiste', () => {
      service.add(offerA1());
      service.add(offerB3());
      service.clear();
      expect(service.items()).toEqual([]);
      expect(service.count()).toBe(0);
      expect(service.total()).toBe(0);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
    });
  });

  describe('Agrupación por distribuidor (#11)', () => {
    beforeEach(() => {
      service.add(offerA1()); // A
      service.add(offerA1()); // A (qty 2)
      service.add(offerA2()); // A
      service.add(offerB3()); // B
    });

    it('agrupa por distribuidor con subtotales correctos', () => {
      const groups = service.distributorGroups();
      expect(groups.length).toBe(2);
      const a = groups.find(g => g.dni === 'A')!;
      const b = groups.find(g => g.dni === 'B')!;
      expect(a.subtotal).toBe(250); // 100*2 + 50
      expect(a.items.length).toBe(2);
      expect(b.subtotal).toBe(200);
    });

    it('hasMultipleDistributors true con dos distribuidores', () => {
      expect(service.hasMultipleDistributors()).toBeTrue();
    });

    it('hasMultipleDistributors false con un solo distribuidor', () => {
      service.clear();
      service.add(offerA1());
      expect(service.hasMultipleDistributors()).toBeFalse();
    });
  });

  describe('buildSalePayloads() (#9: distribuidor real, no "el primero")', () => {
    it('arma un payload por distribuidor con sus productos', () => {
      service.add(offerA1()); // A, qty 2
      service.add(offerA1());
      service.add(offerA2()); // A
      service.add(offerB3()); // B

      const payloads = service.buildSalePayloads('CLI-123');
      expect(payloads.map(p => p.distributorDni).sort()).toEqual(['A', 'B']);

      const a = payloads.find(p => p.distributorDni === 'A')!;
      expect(a.clientDni).toBe('CLI-123');
      expect(a.details).toEqual([
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ]);

      const b = payloads.find(p => p.distributorDni === 'B')!;
      expect(b.details).toEqual([{ productId: 3, quantity: 1 }]);
    });

    it('carrito vacío => sin payloads', () => {
      expect(service.buildSalePayloads('CLI')).toEqual([]);
    });
  });
});
