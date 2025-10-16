// === src/app/services/auth/auth.service.spec.ts ===
// (si moviste el spec a src/app/services/, cambia el import a './auth')
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth'; // <-- usa '../auth' si el spec está en /services/auth/, o './auth' si está junto a auth.ts

type Role = 'admin' | 'employee' | 'client' | string;
interface UserDTO { id: string; email: string; role?: Role }

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login: envía payload, recibe token y luego me() (GET /api/users/me)', (done) => {
    const payload = { email: 'demo@tgs.com', password: 'Demo123!' };
    const mockUser: UserDTO = { id: 'u1', email: payload.email, role: 'admin' };

    service.login(payload).subscribe((u: UserDTO) => {
      expect(u).toEqual(mockUser);
      done();
    });

    // 1) POST /api/auth/login
    const reqLogin = http.expectOne('/api/auth/login');
    expect(reqLogin.request.method).toBe('POST');
    expect(reqLogin.request.body).toEqual(payload);
    reqLogin.flush({ data: mockUser, token: 'jwt' });

    // 2) GET /api/users/me (el servicio la dispara tras login)
    const reqMe = http.expectOne('/api/users/me');
    expect(reqMe.request.method).toBe('GET');
    reqMe.flush({ data: mockUser });
  });

  it('login: maneja error 401', (done) => {
    const payload = { email: 'demo@tgs.com', password: 'bad' };

    service.login(payload).subscribe({
      next: () => fail('debería fallar'),
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      },
    });

    const req = http.expectOne('/api/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('me: retorna el usuario actual desde /api/users/me', (done) => {
    const mockUser: UserDTO = { id: 'u1', email: 'demo@tgs.com', role: 'admin' };

    service.me().subscribe((r: UserDTO | null) => {
      expect(r).toEqual(mockUser);
      done();
    });

    const req = http.expectOne('/api/users/me'); // <-- endpoint real
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockUser });
  });

  it('me: sin sesión retorna error 401 (flujo actual del servicio)', (done) => {
  service.me().subscribe({
    next: () => fail('debería fallar con 401'),
    error: (err) => {
      expect(err.status).toBe(401);
      done();
    },
  });

  const req = http.expectOne('/api/users/me');
  expect(req.request.method).toBe('GET');
  req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
});

  it('logout: hace POST /api/auth/logout y no lanza error', () => {
  service.logout().subscribe();            // 👈 fuerza el request
  const req = http.expectOne('/api/auth/logout');
  expect(req.request.method).toBe('POST');
  req.flush({ success: true });
  http.verify();
});
});
