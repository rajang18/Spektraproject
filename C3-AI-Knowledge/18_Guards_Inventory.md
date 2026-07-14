# Guards Inventory — C3 Main Project

This file lists ALL guard implementations found in the C3 source (`_main_src/src/app`) and where they are used.

## 1) AuthGuard (`CanActivate`)
**File:** `src/app/modules/auth/services/auth.guard.ts`

```ts
@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private _authService: AuthService, private _router: Router, ...) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userContextStr = localStorage.getItem("userinfo");
    const isAuthenticated = !!this._authService?.instance?.getActiveAccount();
    if (isAuthenticated && userContextStr ) {
      return true;
    }
    this._router.navigate(['welcome']);
    return false;
  }
}
```

**Usage:** widely used in feature routing modules, including:
- `modules/home/home-routing.module.ts`
- `modules/partner/partner-routing.module.ts`
- `modules/customers/customers-routing.module.ts`
- `modules/routing.ts`

## 2) WelcomeAuthGuard (`CanActivate`)
**File:** `src/app/modules/auth/services/auth.guard.ts`

```ts
@Injectable({ providedIn: 'root' })
export class WelcomeAuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (this.application.$rootScope.settings) {
      if (!this.application.$rootScope.settings?.DefaultLandingPageURL) {
        return of(true);
      } else if (this._router.url == '/') {
        window.location.href = this.application.$rootScope.settings.DefaultLandingPageURL;
        return of(false);
      } else {
        return of(true);
      }
    }
    return this.application.getApplicationData().pipe(...);
  }
}
```

**Usage:**
- `app-routing.module.ts` on `/welcome` route: `canActivate: [WelcomeAuthGuard]`

## 3) AuthMsalGuard (`CanLoad`)
**File:** `src/app/modules/auth/services/msal_loading_resolver.ts`

```ts
@Injectable({ providedIn: 'root' })
export class AuthMsalGuard implements CanLoad {
  constructor(private router: Router, private userContextService: UserContextService) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return new Observable<boolean>((observer) => {
      this.userContextService.isLoading$.subscribe((isLoading) => {
        if (isLoading) observer.next(false);
        else observer.next(true);
      });
    });
  }
}
```

**Purpose:** blocks module load while user-context authentication flow is still loading.

## 4) TermsAndConditionsDeactivateGuard (`CanDeactivate`)
**File:** `src/app/modules/auth/services/terms-and-conditions-deactivate.guard.ts`

```ts
@Injectable({ providedIn: 'root' })
export class TermsAndConditionsDeactivateGuard implements CanDeactivate<TermsAndConditionsComponent> {
  constructor(private termsAndConditionsService: TermsAndConditionsService) {}

  canDeactivate(
    component: TermsAndConditionsComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): MaybeAsync<GuardResult> {
    return this.termsAndConditionsService.IsAcceptedTermsAndConditions;
  }
}
```

**Usage:**
- `modules/home/home-routing.module.ts` uses `canDeactivate: [TermsAndConditionsDeactivateGuard]`

## 5) RenewalGuard (`CanActivate`)
**File:** `src/app/modules/renewal-manager/renewalgaurd.guard.ts`

```ts
@Injectable({ providedIn: 'root' })
export class RenewalGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    this.loadPermissions();
    return this.loadTenantConfigurations().pipe(
      map(() => {
        const hasPermission = this.permissions.hasNCEScheduleRenewalTab === "Allowed";
        if (this.isAccessAllowedForPartnerOrReseller(hasPermission)) return true;
        if (this.isAccessAllowedForCustomer(hasPermission)) return true;
        this._router.navigate(['/renewalmanager']);
        return false;
      }),
      catchError(() => {
        this._router.navigate(['/renewalmanager']);
        return of(false);
      })
    );
  }
}
```

**Usage:**
- `modules/renewal-manager/schedule-renewal-routing.module.ts`
  - `canActivate: [RenewalGuard]`

## 6) MSAL library guard (provided)
**Class:** `MsalGuard` from `@azure/msal-angular`

**Where configured:**
- `app.module.ts` providers include `MsalGuard` and `MSAL_GUARD_CONFIG`.

**Note:** this is a framework/library guard available to route configs if needed.

---

## Total Guard Types In C3
1. `AuthGuard` (`CanActivate`)
2. `WelcomeAuthGuard` (`CanActivate`)
3. `AuthMsalGuard` (`CanLoad`)
4. `TermsAndConditionsDeactivateGuard` (`CanDeactivate`)
5. `RenewalGuard` (`CanActivate`)
6. `MsalGuard` (library guard from `@azure/msal-angular`, provided in module)

If asked "how many guards", return this full list, not only Welcome/AuthMsal.
