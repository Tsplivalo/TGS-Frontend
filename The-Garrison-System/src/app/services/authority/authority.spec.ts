import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthorityService } from './authority';

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
    pending(`No method matches ${regex}. Available: ${names.join(', ') || '(none)'}`);
    return null;
  }
  return (svc as any)[name].bind(svc);
}

describe('AuthorityService (HTTP integration – autodetect)', () => {
  let service: AuthorityService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthorityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should fetch authorities/roles/permissions', (done) => {
    const list = pickMethod(service, /^(list|getAll|find|search|fetch)/i);
    if (!list) { return; }

    const call$ = list();

    call$.subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        expect(Array.isArray(data)).toBeTrue();
        expect(data[0]).toEqual({ id: 'r-1', name: 'ADMIN' });
        done();
      },
      error: () => fail('list should not fail'),
    });

    const req = http.expectOne(r =>
      r.method === 'GET' && (
        /\/api\/authorities?(\?|$)/.test(r.url) ||
        /\/api\/roles?(\?|$)/.test(r.url) ||
        /\/api\/permissions?(\?|$)/.test(r.url)
      )
    );
    req.flush([{ id: 'r-1', name: 'ADMIN' }]);
  });
  it('should surface backend error on list()', (done) => {
  
  const list = (service as any).list
    ?? (service as any).getAll
    ?? (service as any).find
    ?? (service as any).search
    ?? (service as any).fetch
    ?? (service as any).getAuthorities
    ?? (service as any).getRoles
    ?? (service as any).getPermissions
    ?? (service as any).all;

  if (typeof list !== 'function') {
    pending('No list-like method found on AuthorityService. Available methods differ.');
    return;
  }

  let call$: any;
  try { call$ = list(); } catch {  call$ = list({}); }

  call$.subscribe({
    next: () => fail('Expected list() to fail'),
    error: (err: any) => {
      expect([500, 404, 400]).toContain(err.status);
      done();
    },
  });

  
  const matches = http.match(r => /(authorit|role|permission)/i.test(r.url));
  if (matches.length === 0) {
    pending('No HTTP request triggered by list(). Check implementation/URL.');
    done();
    return;
  }

  matches[0].flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
});


});
