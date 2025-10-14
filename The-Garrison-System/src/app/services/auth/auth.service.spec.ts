import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';


import { AuthService, UserDTO } from './auth';

describe('AuthService (signals + chained login)', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let routerSpy: { navigateByUrl: jasmine.Spy };

  beforeEach(() => {
    routerSpy = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should log in, fetch profile, set signals and return the user', (done) => {
    const mockUser: UserDTO = { id: 'u-1', email: 'admin@garrison.io', roles: ['ADMIN'] };

    service.login({ email: 'admin@garrison.io', password: '1234' }).subscribe({
      next: (user: UserDTO) => {
        expect(user).toEqual(mockUser);
        expect(service.isLoggedIn()).toBeTrue();
        expect(service.user()).toEqual(mockUser);
        done();
      },
      error: () => fail('Expected successful login flow'),
    });

    const post = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/auth/login' && r.withCredentials === true
    );
    expect(post.request.body).toEqual({ email: 'admin@garrison.io', password: '1234' });
    post.flush({ success: true });

    const me = http.expectOne(
      (r) => r.method === 'GET' && r.url === '/api/users/me' && r.withCredentials === true
    );
    me.flush({ data: mockUser });
  });

  it('should propagate error on login failure and keep signals cleared', (done) => {
    service.login({ email: 'bad@user.io', password: 'wrong' }).subscribe({
      next: () => fail('Expected error'),
      error: (err: any) => {
        expect(service.isLoggedIn()).toBeFalse();
        expect(service.user()).toBeNull();
        expect(err.status).toBe(401);
        done();
      },
    });

    const post = http.expectOne('/api/auth/login');
    post.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

   
    const extra = http.match('/api/users/me');
    expect(extra.length).toBe(0);
  });

  it('should logout, clear signals and navigate to "/"', () => {
    (service as any).user.set({ id: 'u-1', email: 'x@y.z' } as UserDTO);
    (service as any).isLoggedIn.set(true);

    service.logout();

    const req = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/auth/logout' && r.withCredentials === true
    );
    req.flush({ success: true });

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('me() should fetch profile and update signals', (done) => {
    const mockUser: UserDTO = { id: 'u-9', email: 'me@garrison.io', roles: ['CLIENT'] };

    service.me().subscribe({
      next: (user: UserDTO | null) => {
        expect(user).toEqual(mockUser);
        expect(service.isLoggedIn()).toBeTrue();
        expect(service.user()).toEqual(mockUser);
        done();
      },
      error: () => fail('Expected me() to succeed'),
    });

    const me = http.expectOne(
      (r) => r.method === 'GET' && r.url === '/api/users/me' && r.withCredentials === true
    );
    me.flush({ data: mockUser });
  });

  it('register() should POST credentials and return API response', (done) => {
    service
      .register({ username: 'luca', email: 'luca@mail.com', password: '1234' })
      .subscribe({
        next: (res: any) => {
          expect(res).toEqual({ success: true, message: 'ok' });
          done();
        },
        error: () => fail('register should not fail'),
      });

    const req = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/auth/register' && r.withCredentials === true
    );
    expect(req.request.body).toEqual({
      username: 'luca',
      email: 'luca@mail.com',
      password: '1234',
    });
    req.flush({ success: true, message: 'ok' });
  });

  it('me() should handle null session and clear signals', (done) => {
    // prime signals as logged in to verify they get cleared
    (service as any).user.set({ id: 'x', email: 'x@y.z', roles: ['ADMIN'] });
    (service as any).isLoggedIn.set(true);

    service.me().subscribe({
      next: (u: any) => {
        expect(u).toBeNull();
        expect(service.user()).toBeNull();
        expect(service.isLoggedIn()).toBeFalse();
        done();
      },
      error: () => fail('me() should not fail for null session'),
    });

    const me = http.expectOne(
      (r) => r.method === 'GET' && r.url === '/api/users/me' && r.withCredentials === true
    );
    me.flush({ data: null });
  });

  it('roles()/hasRole()/isClient() helpers should reflect current user', () => {
    (service as any).user.set({ id: '1', email: 'a@b.c', roles: ['CLIENT'] });
    expect(service.roles()).toEqual(['CLIENT']);
    expect(service.hasRole('CLIENT')).toBeTrue();
    expect(service.hasRole('ADMIN')).toBeFalse();
    expect(service.isClient()).toBeTrue();

    (service as any).user.set({ id: '2', email: 'a@b.c', roles: ['ADMIN'] });
    expect(service.roles()).toEqual(['ADMIN']);
    expect(service.isClient()).toBeFalse();
  });

  it('logout() should clear signals even when API errors', () => {
    (service as any).user.set({ id: 'u-1', email: 'x@y.z' });
    (service as any).isLoggedIn.set(true);

    service.logout();

    const req = http.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();

  
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });
});
