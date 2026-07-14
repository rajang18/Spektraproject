import { Observable } from 'rxjs';
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
import { FactoryProvider, InjectionToken } from '@angular/core';
import { environment } from 'src/environments/environment';  
import { MsalAuthService } from './msal-auth.service';
import { GoogleAuthService } from './google-auth.service';

export abstract class AuthService {
  abstract instance: any;
  abstract initialize(): Observable<void>;
  abstract acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult>;
  abstract acquireTokenRedirect(request: RedirectRequest): Observable<void>;
  abstract acquireTokenSilent(request: SilentRequest): Observable<AuthenticationResult>;
  abstract handleRedirectObservable(hash?: string): Observable<AuthenticationResult>;
  abstract loginPopup(request?: PopupRequest): Observable<AuthenticationResult>;
  abstract loginRedirect(request?: RedirectRequest): Observable<void>;
  abstract logout(logoutRequest?: EndSessionRequest): Observable<void>;
  abstract logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void>;
  abstract logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void>;
  abstract ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult>;
  abstract getLogger(): Logger;
  abstract setLogger(logger: Logger): void;
}
 

export function authServiceFactory(msalAuth: MsalAuthService,googleAuth: GoogleAuthService): AuthService {
  let loginType=localStorage.getItem("ExternalProvider")??"mslLogin"
  switch(loginType){ 
    case "mslLogin":
      return msalAuth;
    case "Google":
      return googleAuth; 
    default :
      return googleAuth;
  } 
}


export const AuthProvider: FactoryProvider = {
  provide: AuthService,
  useFactory: authServiceFactory,
  deps: [MsalAuthService,GoogleAuthService]
};