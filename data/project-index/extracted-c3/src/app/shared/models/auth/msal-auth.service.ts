import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable, from } from 'rxjs';
import { 
  AuthenticationResult, 
  IPublicClientApplication, 
  PopupRequest, 
  RedirectRequest, 
  SilentRequest, 
  EndSessionRequest, 
  EndSessionPopupRequest, 
  SsoSilentRequest, 
  Logger 
} from '@azure/msal-browser';  
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MsalAuthService implements AuthService {
  instance: IPublicClientApplication;

  constructor(private msalService: MsalService) {
    this.instance = msalService.instance;
  }

  initialize(): Observable<void> {
    return this.msalService.initialize();
  }

  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
    return from(this.msalService.acquireTokenPopup(request));
  }

  acquireTokenRedirect(request: RedirectRequest): Observable<void> {
    return from(this.msalService.acquireTokenRedirect(request));
  }

  acquireTokenSilent(request: SilentRequest): Observable<AuthenticationResult> {
    return from(this.msalService.acquireTokenSilent(request));
  }

  handleRedirectObservable(hash?: string): Observable<AuthenticationResult> {
    return this.msalService.handleRedirectObservable();
  }

  loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
    return from(this.msalService.loginPopup(request));
  }

  loginRedirect(request?: RedirectRequest): Observable<void> {
    return from(this.msalService.loginRedirect(request));
  }

  logout(logoutRequest?: EndSessionRequest): Observable<void> {
    return from(this.msalService.logout(logoutRequest));
  }

  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void> {
    return from(this.msalService.logoutRedirect(logoutRequest));
  }

  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void> {
    return from(this.msalService.logoutPopup(logoutRequest));
  }

  ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult> {
    return from(this.msalService.ssoSilent(request));
  }

  getLogger(): Logger {
    return this.msalService.getLogger();
  }

  setLogger(logger: Logger): void {
    this.msalService.setLogger(logger);
  }
}
