import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router'; 
import { catchError, map, Observable, of } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { SessionTimeoutService } from 'src/app/services/session-timeout.service';
import { AuthService } from 'src/app/shared/models/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private _authService: AuthService,
     private _router: Router,
     private commonService:CommonService, 
     private sessionTimeoutService: SessionTimeoutService
    ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userContextStr = localStorage.getItem("userinfo");
    // const authorizationData = localStorage.getItem("authorizationData");
    const isAuthenticated = !!this._authService?.instance?.getActiveAccount();
    if (isAuthenticated && userContextStr ) {
      //  this.sessionTimeoutService.setLoggedIn(true); // Set logged in status
      //  this.sessionTimeoutService.resetSession();

      return true;
    
    }

    // not logged in so redirect to login page with the return url
    this._router.navigate(['welcome']);
    //this.authService.logout();
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WelcomeAuthGuard implements CanActivate {
  constructor(
    private _router: Router,
    private application: AppSettingsService,
    private sessionTimeoutService: SessionTimeoutService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (this.application.$rootScope.settings) {
      if (!this.application.$rootScope.settings?.DefaultLandingPageURL) {
        return of(true);
      }
      else if(this._router.url == '/'){
        window.location.href = this.application.$rootScope.settings.DefaultLandingPageURL;
        return of(false);
      }else{
        return of(true);
      }
      
    } else {
      return this.application.getApplicationData().pipe(
        map(() => {
          if (!this.application.$rootScope.settings?.DefaultLandingPageURL) {
            return true;
          }
          else if(this._router.url == '/'){
            window.location.href = this.application.$rootScope.settings.DefaultLandingPageURL;
            return false;
          }
          else{
            return true;
          }
        }),
        catchError(() => { 
          return of(false);
        })
      );
    }
  }
}

