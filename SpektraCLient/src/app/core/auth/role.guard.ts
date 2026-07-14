import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { AuthStoreService } from './auth-store.service';

export const roleGuard: CanMatchFn = (route: Route, _segments: UrlSegment[]) => {
  const authStore = inject(AuthStoreService);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  return !allowedRoles?.length || allowedRoles.some((role) => authStore.roles().includes(role));
};
