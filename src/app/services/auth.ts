import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

export type Role = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

export type Me = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

const API = 'http://localhost:8080/api';
const LS_TOKEN = 'basic_token';
const LS_ME = 'me';

function toBasic(email: string, password: string) {
  return btoa(`${email}:${password}`);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<Me | null>(null);
  user = this._user.asReadonly();

  constructor() {
    const saved = localStorage.getItem(LS_ME);
    if (saved) {
      try {
        this._user.set(JSON.parse(saved));
      } catch {}
    }
  }

  token(): string | null {
    return localStorage.getItem(LS_TOKEN);
  }

  isLoggedIn(): boolean {
    return !!this.token() && !!this._user();
  }

  login(email: string, password: string) {
    const token = toBasic(email.trim(), password);
    localStorage.setItem(LS_TOKEN, token);

    return this.http.get<Me>(`${API}/me`).pipe(
      tap((me) => {
        this._user.set(me);
        localStorage.setItem(LS_ME, JSON.stringify(me));
      }),
      catchError((err: HttpErrorResponse) => {
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_ME);
        this._user.set(null);
        return of(null);
      })
    );
  }

  logout() {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ME);
    this._user.set(null);
    this.router.navigateByUrl('/login');
  }

  register(email: string, password: string, name: string, role: Role) {
    return this.http.post(`${API}/register`, { email, password, name, role });
  }

  adminCreateUser(email: string, password: string, name: string, role: Role) {
    return this.http.post(`${API}/admin/create-user`, { email, password, name, role });
  }

  // ----------------------------
  // ADMIN: Users CRUD (via /api/orders/users)
  // ----------------------------

  // READ list
  adminListUsers() {
    return this.http.get<any[]>(`${API}/orders/users`);
  }

  // UPDATE
  adminUpdateUser(id: number, name: string, role: Role) {
    return this.http.put<any>(`${API}/orders/users/${id}`, { name, role });
  }

  // DELETE
  adminDeleteUser(id: number) {
    return this.http.delete<any>(`${API}/orders/users/${id}`);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Basic ${token}` },
  });
  return next(authReq);
};

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigateByUrl('/login');
  return false;
};

export const roleGuard = (...allowed: Role[]) => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.user()?.role;
    if (role && allowed.includes(role)) return true;
    router.navigateByUrl('/books');
    return false;
  };
};
