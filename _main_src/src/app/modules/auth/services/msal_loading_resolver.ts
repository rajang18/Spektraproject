import { Injectable } from '@angular/core';
import { CanLoad, Route, UrlSegment, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserContextService } from 'src/app/services/user-context.service';

@Injectable({
  providedIn: 'root',
})
export class AuthMsalGuard implements CanLoad {
  constructor(private router: Router,
    private userContextService: UserContextService
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    // Check the loading state or some authentication state here
    return new Observable<boolean>((observer) => {
      this.userContextService.isLoading$.subscribe((isLoading) => {
        if (isLoading) {
          observer.next(false); // Prevent loading the module if authentication is in progress
        } else {
          observer.next(true); // Allow loading the module once authentication is complete
        }
      });
    });
  }
}
