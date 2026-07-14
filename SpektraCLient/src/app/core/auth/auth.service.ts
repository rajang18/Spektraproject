import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiResponse } from '../api/api-response.model';
import { BaseApiService } from '../api/base-api.service';
import { AuthStoreService } from './auth-store.service';
import { TokenStorageService } from './token-storage.service';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  username: string;
  displayName: string;
  email: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(BaseApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly tokenStorage = inject(TokenStorageService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginRequest, ApiResponse<LoginResponse>>('/auth/login', request).pipe(
      map((response) => response.data),
      tap((user) => {
        this.tokenStorage.setAccessToken(user.accessToken);
        this.authStore.setUser({
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          roles: user.roles
        });
      })
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.authStore.setUser(null);
  }
}
