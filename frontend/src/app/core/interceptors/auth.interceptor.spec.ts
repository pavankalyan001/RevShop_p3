import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let handle: jasmine.Spy;
  let next: HttpHandler;

  beforeEach(() => {
    interceptor = new AuthInterceptor();
    handle = jasmine.createSpy('handle').and.returnValue(of(new HttpResponse({ status: 200 })));
    next = { handle } as HttpHandler;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('adds the bearer token when one exists in localStorage', () => {
    localStorage.setItem('token', 'jwt-token');

    interceptor.intercept(new HttpRequest('GET', '/api/orders'), next).subscribe();

    const forwardedRequest = handle.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer jwt-token');
  });

  it('forwards the original request unchanged when no token exists', () => {
    interceptor.intercept(new HttpRequest('GET', '/api/orders'), next).subscribe();

    const forwardedRequest = handle.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.has('Authorization')).toBeFalse();
  });
});
