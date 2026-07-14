import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

const USER_STORAGE_KEY = 'spektra.user';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly _user = signal<User | null>(readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly firstName = computed(() => this._user()?.displayName?.split(' ')[0] ?? '');

  setUser(user: User | null): void {
    this._user.set(user);

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
}

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}
