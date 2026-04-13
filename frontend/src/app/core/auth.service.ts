import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthPayload } from './models';

const sessionKey = 'employee_portal_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  get token(): string | null {
    return this.readSession()?.token ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  saveSession(payload: AuthPayload): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(sessionKey, JSON.stringify(payload));
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(sessionKey);
    }
    void this.router.navigate(['/login']);
  }

  private readSession(): AuthPayload | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const value = localStorage.getItem(sessionKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthPayload;
    } catch {
      localStorage.removeItem(sessionKey);
      return null;
    }
  }
}
