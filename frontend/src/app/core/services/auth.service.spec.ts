import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { AuthService } from './auth.service';
import { AppState } from '../store/app-state.models';
import { appReducers } from '../store/app-state.reducer';

const createToken = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let store: Store<AppState>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, StoreModule.forRoot(appReducers)]
    });
    service = TestBed.inject(AuthService);
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store) as Store<AppState>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('logs in, stores the token, and updates the current user', () => {
    let tokenResult = '';
    service.login({ email: 'buyer@example.com', password: 'secret123' }).subscribe(token => {
      tokenResult = token;
    });

    const request = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      token: 'jwt-token',
      userId: 5,
      name: 'Buyer',
      email: 'buyer@example.com',
      role: 'BUYER'
    });

    expect(tokenResult).toBe('jwt-token');
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(service.currentUser).toEqual({
      id: 5,
      username: 'Buyer',
      role: 'BUYER',
      email: 'buyer@example.com'
    });
  });

  it('registers with a text response', () => {
    let response = '';
    service.register({ name: 'Buyer' }).subscribe(value => {
      response = value;
    });

    const request = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(request.request.responseType).toBe('text');
    request.flush('Registered');

    expect(response).toBe('Registered');
  });

  it('requests and resets passwords with text endpoints', () => {
    let forgotResponse = '';
    let resetResponse = '';

    service.forgotPassword({ email: 'buyer@example.com' }).subscribe(value => {
      forgotResponse = value;
    });
    service.resetPassword({ token: '123456' }).subscribe(value => {
      resetResponse = value;
    });

    httpMock.expectOne('http://localhost:8080/api/auth/forgot-password').flush('Reset requested');
    httpMock.expectOne('http://localhost:8080/api/auth/reset-password').flush('Reset completed');

    expect(forgotResponse).toBe('Reset requested');
    expect(resetResponse).toBe('Reset completed');
  });

  it('hydrates the current user from a stored token on construction', () => {
    localStorage.setItem('token', createToken({ userId: 9, sub: 'buyer@example.com', role: 'BUYER' }));

    const reloaded = new AuthService(httpClient, store);

    expect(reloaded.currentUser).toEqual({
      id: 9,
      username: 'buyer@example.com',
      role: 'BUYER',
      email: 'buyer@example.com'
    });
  });

  it('clears an invalid stored token during initialization', () => {
    localStorage.setItem('token', 'bad-token');

    const reloaded = new AuthService(httpClient, store);

    expect(reloaded.currentUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logs out by removing the token and resetting currentUser', () => {
    service.saveToken('jwt-token');
    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.currentUser).toBeNull();
  });
});
