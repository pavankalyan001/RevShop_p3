import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthPageComponent } from './auth-page.component';
import { AuthService, User } from '../../../core/services/auth.service';

const createToken = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('AuthPageComponent', () => {
  let component: AuthPageComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let currentUser: User | null;

  beforeEach(() => {
    currentUser = null;
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register']);
    Object.defineProperty(authService, 'currentUser', {
      get: () => currentUser
    });

    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    component = new AuthPageComponent(new FormBuilder(), authService, router);
  });

  it('redirects sellers that are already logged in', () => {
    currentUser = { id: 1, username: 'seller', role: 'SELLER' };

    component.ngOnInit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/seller/dashboard');
  });

  it('initializes forms for new visitors', () => {
    component.ngOnInit();

    expect(component.loginForm).toBeDefined();
    expect(component.registerForm.get('role')?.value).toBe('BUYER');
  });

  it('switchTab resets transient messages', () => {
    component.message = 'ok';
    component.error = 'bad';

    component.switchTab(false);

    expect(component.isLogin).toBeFalse();
    expect(component.message).toBe('');
    expect(component.error).toBe('');
  });

  it('marks login fields as touched when the login form is invalid', () => {
    component.ngOnInit();

    component.login();

    expect(component.loginForm.get('email')?.touched).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('logs in and routes buyers to the dashboard', () => {
    component.ngOnInit();
    component.loginForm.setValue({ email: 'buyer@example.com', password: 'secret123' });
    authService.login.and.returnValue(of(createToken({ role: 'BUYER' })));

    component.login();

    expect(authService.login).toHaveBeenCalledWith(component.loginForm.value);
    expect(component.message).toBe('Login successful');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/buyer/dashboard');
  });

  it('shows the backend error message when login fails', () => {
    component.ngOnInit();
    component.loginForm.setValue({ email: 'buyer@example.com', password: 'secret123' });
    authService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.login();

    expect(component.error).toBe('Invalid credentials');
    expect(component.message).toBe('');
  });

  it('registers a user and switches back to login mode', () => {
    component.ngOnInit();
    component.isLogin = false;
    component.registerForm.setValue({
      name: 'Buyer Name',
      email: 'buyer@example.com',
      password: 'secret123',
      role: 'BUYER',
      businessName: ''
    });
    authService.register.and.returnValue(of('Registered'));

    component.register();

    expect(authService.register).toHaveBeenCalledWith(component.registerForm.value);
    expect(component.message).toBe('Registered');
    expect(component.error).toBe('');
    expect(component.isLogin).toBeTrue();
  });

  it('shows the backend string error when registration fails', () => {
    component.ngOnInit();
    component.isLogin = false;
    component.registerForm.setValue({
      name: 'Buyer Name',
      email: 'buyer@example.com',
      password: 'secret123',
      role: 'BUYER',
      businessName: ''
    });
    authService.register.and.returnValue(throwError(() => ({ error: 'Email already exists' })));

    component.register();

    expect(component.error).toBe('Email already exists');
    expect(component.message).toBe('');
  });
});
