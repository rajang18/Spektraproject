import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { AuthenticationResult, EndSessionPopupRequest, EndSessionRequest, Logger, PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService implements AuthService {
  instance: any;

  constructor() {
    this.instance = new GoogleClientApplication();
  }

  initialize(): Observable<void> {
    return of(undefined);
  }

  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
    return of({ accessToken: 'external-popup-token' } as AuthenticationResult);
  }

  acquireTokenRedirect(request: RedirectRequest): Observable<void> {
    return of(undefined);
  }

  acquireTokenSilent(request: SilentRequest): Observable<AuthenticationResult> {
    return of({ accessToken: 'external-silent-token' } as AuthenticationResult);
  }

  handleRedirectObservable(hash?: string): Observable<AuthenticationResult> {
    return of(null);
  }

  loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
    return of({ accessToken: 'external-popup-login-token' } as AuthenticationResult);
  }

  loginRedirect(request?: RedirectRequest): Observable<void> {
    // call external portal url for login page
    return of(undefined);
  }

  logout(logoutRequest?: EndSessionRequest): Observable<void> {
    //local storage clear
    this.instance = null;
    return of(undefined);
  }

  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void> {
    // call external portal url for redirect else welcome page
    // return of(undefined);
    // Clear the Google session (in-memory and stored)
    this.instance?.setActiveAccount(null);

    // Optional: parse postLogoutRedirectUri
    const redirectUrl =
      logoutRequest?.postLogoutRedirectUri || '/welcome';

    // Optional: you can call Google's logout endpoint (if needed)
    // But for simple OAuth2 token-based login, clearing local storage is enough

    // Redirect manually
    window.location.href = redirectUrl;
    return of(undefined);

  }

  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void> {
    return of(undefined);
  }

  ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult> {
    return of({ accessToken: 'external-sso-token' } as AuthenticationResult);
  }

  getLogger(): Logger {
    return null//new Logger(() => {});
  }

  setLogger(logger: Logger): void {
    console.log('Logger set for external provider');
  }
}


export class GoogleClientApplication {
  private account: any;

  constructor() {
    this.initialize()
  }

  initialize() {

    let result = localStorage.getItem("authorizationData")
    if (result && result != 'undefined') {
      console.log('Google Redirect Login Successful:', result);
      this.setActiveAccount(JSON.parse(result));
    } else {
      // No redirect result, restore previous account
      let activeAccount = this.getActiveAccount();
      if (activeAccount) {
        this.setActiveAccount(activeAccount);
      }
    }

  }


  getActiveAccount(): any | null {
    return this.account
  }

  setActiveAccount(account: any | null) {
    this.account = {
      environment: null,
      name: account?.userName,
      idToken: account?.token
    };
  }
}

