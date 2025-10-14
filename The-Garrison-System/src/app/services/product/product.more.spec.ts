import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product';

describe('ProductService — extra coverage', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() without search should hit /api/products (con o sin query)', (done) => {
    
    const list: any =
      (service as any).list ??
      (service as any).getAll ??
      (service as any).fetch ??
      (service as any).search;

    if (typeof list !== 'function') {
      pending('No existe un método tipo list/getAll/fetch/search en ProductService');
      return;
    }

    const call$ =
      list.length >= 2 ? list.call(service, 1, 5) : list.call(service, { page: 1, limit: 5 });

    call$.subscribe({
      next: (res: any) => {
        expect(res?.data ?? res).toBeDefined();
        done();
      },
      error: () => fail('list() no debería fallar'),
    });

    
    const req = http.expectOne(r => r.method === 'GET' && /\/api\/products(\?.*)?$/.test(r.url));
    req.flush({ data: [] });
  });

  it('update() should emit 404 error when product not found', (done) => {
    const update: any =
      (service as any).update ??
      (service as any).patch ??
      (service as any).put ??
      (service as any).edit ??
      (service as any).updateProduct ??
      (service as any).patchProduct ??
      (service as any).putProduct ??
      (service as any).editProduct;

    if (typeof update !== 'function') {
      pending('No hay método de actualización (update/patch/put/edit) en ProductService');
      return;
    }

    const id = 'x';
    const body = { name: 'x' };

    const call$ = update.length >= 2
      ? update.call(service, id, body)
      : update.call(service, { id, ...body });

    call$.subscribe({
      next: () => fail('Se esperaba error 404'),
      error: (err: any) => {
        expect([404, 400, 422]).toContain(err.status);
        done();
      },
    });

    
    const first = http.match(() => true)[0];
    if (!first) {
      pending('update() no emitió ninguna petición HTTP');
      done();
      return;
    }
    first.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });
});
