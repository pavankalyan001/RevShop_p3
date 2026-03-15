import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  username: string;
  role?: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = `${environment.apiBaseUrl}/auth`;

  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();
  get currentUser(): User | null { return this._currentUser.value; }

  constructor(private http: HttpClient) {
    this.checkToken();
  }

  private checkToken() {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this._currentUser.next({
          id: Number(decoded.userId) || 0,
          username: decoded.sub || 'User',
          role: decoded.role,
          email: decoded.sub
        });
      } catch (e) {
        this.logout();
      }
    }
  }

  login(data: any): Observable<string> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((response) => {
        this.saveToken(response.token);
        this._currentUser.next({
          id: response.userId,
          username: response.name || response.email || 'User',
          role: response.role,
          email: response.email
        });
      }),
      map((response) => response.token)
    );
  }

  register(data: any) {
    return this.http.post(
      `${this.baseUrl}/register`,
      data,
      { responseType: 'text' }
    );
  }

  forgotPassword(data: any) {
    return this.http.post(
      `${this.baseUrl}/forgot-password`,
      data,
      { responseType: 'text' }
    );
  }

  resetPassword(data: any) {
    return this.http.post(
      `${this.baseUrl}/reset-password`,
      data,
      { responseType: 'text' }
    );
  }

  saveToken(token: string) {
    localStorage.setItem("token", token);
  }

  getToken() {
    return localStorage.getItem("token");
  }

  logout() {
    localStorage.removeItem("token");
    this._currentUser.next(null);
  }

}
