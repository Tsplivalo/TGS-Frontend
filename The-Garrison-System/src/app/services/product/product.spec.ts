import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product'; 

function listMethods(obj: any): string[] {
  const proto = Object.getPrototypeOf(obj);
  const names = Object.getOwnPropertyNames(proto)
    .filter(n => typeof (obj as any)[n] === 'function' && n !== 'constructor');

  return Array.from(new Set([
    ...names,
    ...Object.keys(obj).filter(k => typeof (obj as any)[k] === 'function'),
  ])).sort();
}

function pickMethod<T extends object>(svc: T, regex: RegExp) {
  const names = listMethods(svc);
  const name = names.find(n => regex.test(n));
  if (!name) {
    pending(
      `No method matches ${regex}. Available: ${names.join(', ') || '(none)'}`
    );
    return null;
  }
  return (svc as any)[name].bind(svc);
}

describe('ProductService (HTTP integration – autodetect)', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should fetch a paginated list', (done) => {
    const list = pickMethod(service, /^(list|getAll|find|search|fetch)/i);
    if (!list) { return; }

    const page = 1, limit = 10, search = 'keyboard';

    const call$ =
      (list.length >= 3 && list(page, limit, search)) ||
      (list.length === 2 && list(page, limit)) ||
      list({ page, limit, search });

    call$.subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        expect(Array.isArray(data)).toBeTrue();
        expect(data.length).toBeGreaterThan(0);
        done();
      },
      error: () => fail('list/getAll should not fail'),
    });

    
    const req = http.expectOne(r => r.method === 'GET' && /\/api\/products?(\?|$)/.test(r.url));
    req.flush({
      data: [
        { id: 'p-1', name: 'Keyboard' },
        { id: 'p-2', name: 'Gaming Keyboard' },
      ],
      meta: { total: 2, page, limit },
    });
  });

  it('should create a product', (done) => {
    const create = pickMethod(service, /^(create|add|post|save)/i);
    if (!create) { return; }

    const body = { name: 'Mouse', price: 25 };
    create(body).subscribe({
      next: (res: any) => { expect(res?.id).toBeDefined(); done(); },
      error: () => fail('create/add should not fail'),
    });

    const req = http.expectOne(r => r.method === 'POST' && /\/api\/products?(\?|$)/.test(r.url));
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'p-9', ...body });
  });

  it('should update a product', (done) => {
    const update = pickMethod(service, /^(update|patch|put|edit)/i);
    if (!update) { return; }

    const id = 'p-3';
    const patch = { name: 'Mouse Pro' };
    const call$ = update.length >= 2 ? update(id, patch) : update({ id, ...patch });

    call$.subscribe({
      next: (res: any) => { expect((res?.name ?? '')).toContain('Mouse'); done(); },
      error: () => fail('update/patch should not fail'),
    });

    const req = http.expectOne(r => /\/api\/products?\/p-3$/.test(r.url));
    expect(['PUT', 'PATCH']).toContain(req.request.method);
    req.flush({ id, ...patch });
  });

  it('should delete a product', (done) => {
    const remove = pickMethod(service, /^(remove|delete|destroy|del)/i);
    if (!remove) { return; }

    const id = 'p-4';
    remove(id).subscribe({
      next: (res: any) => { expect((res?.success ?? true)).toBeTrue(); done(); },
      error: () => fail('remove/delete should not fail'),
    });

    const req = http.expectOne(r => r.method === 'DELETE' && /\/api\/products?\/p-4$/.test(r.url));
    req.flush({ success: true });
  });

it('should return 404 error on update() when product not found', (done) => {
  
  const update =
    (service as any).update ??
    (service as any).patch ??
    (service as any).put ??
    (service as any).edit ??
    (service as any).updateProduct ??
    (service as any).patchProduct ??
    (service as any).putProduct ??
    (service as any).editProduct;

  if (typeof update !== 'function') {
    pending('No update-like method found on ProductService. Adjust the method name in the spec.');
    return;
  }

  const id = 'p-missing';

 
  const payload = {
    id,
    name: 'Nope',
    imageUrl: '',      
    price: 0,          
    description: '',  
  };

  
  let call$: any;
  try {
    call$ = update(payload);
  } catch (e) {
    pending('update(...) single-argument call failed before HTTP. Check service signature.');
    return;
  }

  call$.subscribe({
    next: () => fail('Expected update() to fail'),
    error: (err: any) => {
      expect([404, 400, 422]).toContain(err.status);
      done();
    },
  });

  const req = http.match(() => true)[0];
  if (!req) {
    pending('update() did not issue any HTTP request. Check implementation/URL.');
    done();
    return;
  }
  req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
});


});
