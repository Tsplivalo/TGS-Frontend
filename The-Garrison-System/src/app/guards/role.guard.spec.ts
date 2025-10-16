import { TestBed } from '@angular/core/testing';
import { AuthService, Role } from '../services/auth/auth';

describe('role guards helpers', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    auth = TestBed.inject(AuthService);
  });

  it('hasAnyRole true si usuario tiene alguno', () => {
    (auth as any).user.set({ id:'1', email:'a@b.c', roles:[Role.CLIENT, Role.ADMIN] });
    expect(auth.hasAnyRole([Role.PARTNER, Role.ADMIN])).toBeTrue();
  });

  it('hasAnyRole false si no coincide', () => {
    (auth as any).user.set({ id:'1', email:'a@b.c', roles:[Role.CLIENT] });
    expect(auth.hasAnyRole([Role.PARTNER, Role.DISTRIBUTOR])).toBeFalse();
  });
});
