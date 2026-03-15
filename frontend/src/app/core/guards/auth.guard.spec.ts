import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService, User } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;
  let currentUser: User | null;
  let authService: AuthService;

  beforeEach(() => {
    currentUser = null;
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService = {} as AuthService;
    Object.defineProperty(authService, 'currentUser', {
      get: () => currentUser
    });
    guard = new AuthGuard(authService, router);
  });

  const createRoute = (role?: string): ActivatedRouteSnapshot => ({
    data: role ? { role } : {}
  } as ActivatedRouteSnapshot);

  const createState = (url: string): RouterStateSnapshot => ({
    url
  } as RouterStateSnapshot);

  it('allows navigation when the user is logged in with the expected role', () => {
    currentUser = { id: 1, username: 'buyer', role: 'BUYER' };

    expect(guard.canActivate(createRoute('BUYER'), createState('/buyer/dashboard'))).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects authenticated sellers away from buyer-only routes', () => {
    currentUser = { id: 1, username: 'seller', role: 'SELLER' };

    expect(guard.canActivate(createRoute('BUYER'), createState('/orders'))).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/seller/dashboard']);
  });

  it('redirects unauthenticated users to login with a returnUrl', () => {
    expect(guard.canActivate(createRoute('BUYER'), createState('/checkout'))).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/checkout' }
    });
  });
});
