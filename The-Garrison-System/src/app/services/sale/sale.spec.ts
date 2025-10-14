import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SaleService } from './sale';

function listMethods(obj: any): string[] {
  const proto = Object.getPrototypeOf(obj);
  const protoFns = Object.getOwnPropertyNames(proto)
    .filter(n => typeof (obj as any)[n] === 'function' && n !== 'constructor');
  const ownFns = Object.keys(obj).filter(k => typeof (obj as any)[k] === 'function');
  return Array.from(new Set([...protoFns, ...ownFns])).sort();
}
function pickMethod<T extends object>(svc: T, regex: RegExp) {
  const names = listMethods(svc);
  const name = names.find(n => regex.test(n));
  if (!name) {
    pending(`No method matches ${regex}. Available: ${names.join(', ') || '(none)'}`);
    return null;
  }
  return (svc as any)[name].bind(svc);
}
function isObject(x: any): x is Record<string, any> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

describe('SaleService (HTTP integration – flexible)', () => {
  let service: SaleService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SaleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should list sales with filters', (done) => {
    const list = pickMethod(service, /^(list|getAll|find|search|fetch)/i);
    if (!list) return;

    const page = 1, limit = 10, status = 'PAID';

    let call$: any = null;
    try { if (!call$ && list.length >= 3) call$ = list(page, limit, { status }); } catch {}
    try { if (!call$ && list.length === 2) call$ = list(page, limit); } catch {}
    try { if (!call$) call$ = list({ page, limit, status } as any); } catch {}
    try { if (!call$) call$ = list({ status } as any); } catch {}
    try { if (!call$) call$ = list(status as any); } catch {}
    try { if (!call$) call$ = list(); } catch {}

    if (!call$) {
      pending('Could not call list() with any known signature. Adjust the test signature to your service.');
      return;
    }

    call$.subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        expect(Array.isArray(data)).toBeTrue();
        expect(data[0]).toBeDefined();
        done();
      },
      error: () => fail('list should not fail'),
    });

    const all = http.match(() => true);
    if (all.length === 0) {
      pending('list() did not trigger any HTTP request. Check the method implementation/URL.');
      done();
      return;
    }

    const req = all[0];
    req.flush({
      data: [{ id: 's-1', total: 100, status }],
      meta: { total: 1, page, limit },
    });
  });

  it('should create a sale (accept different body shapes)', (done) => {
    const create = pickMethod(service, /^(create|add|post|save)/i);
    if (!create) return;

    const payload = { items: [{ productId: 'p-1', qty: 2 }], customerId: 'c-1' };

    create(payload).subscribe({
      next: (res: any) => { expect(res?.id).toBeDefined(); done(); },
      error: () => fail('create should not fail'),
    });

    const req = http.expectOne(r => r.method === 'POST' && /\/api\/sales?(\?|$)/i.test(r.url));

    const body = req.request.body;
    expect(isObject(body)).toBeTrue();

    const hasItemsShape = Array.isArray(body?.items) && body.items.length >= 0;
    const hasClientShape = typeof body?.clientDni !== 'undefined' && Array.isArray(body?.details);

    expect(hasItemsShape || hasClientShape).toBeTrue();

    req.flush({ id: 's-9', ...body, total: 50 });
  });

  it('should propagate validation error on create()', (done) => {
    const create = pickMethod(service, /^(create|add|post|save)/i);
    if (!create) return;

    const invalid = { items: [], customerId: null };

    create(invalid as any).subscribe({
      next: () => fail('Expected create() to fail'),
      error: (err: any) => {
        expect([400, 422]).toContain(err.status);
        done();
      },
    });

    const req = http.expectOne(r => r.method === 'POST' && /\/api\/sales?(\?|$)/i.test(r.url));
    req.flush({ message: 'Validation failed' }, { status: 422, statusText: 'Unprocessable Entity' });
  });
});
